import whatsappService from './whatsappService.js';
import config from '../config/env.js';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import axios from 'axios';

class MessageHandler {
  async handleIncomingMessage(message, senderInfo, shouldRemoveLastColumn = false) { // 👈 Aquí agregamos el nuevo parámetro
    const fromNumber = message.from.slice(0, 2) + message.from.slice(3);

    if (message?.type === "text") {
      const incomingMessage = message.text.body.toLowerCase().trim();

      if (this.isGreeting(incomingMessage)) {
        await this.sendWelcomeMessage(fromNumber, message.id, senderInfo);
        await this.sendWelcomeMenu(fromNumber);
      } else {
        await this.handleUserText(fromNumber, incomingMessage, message.id, shouldRemoveLastColumn); // 👈 Lo pasamos aquí
      }

      await whatsappService.markAsRead(message.id);
    } else if (message?.type === 'interactive') {
      const option = message?.interactive?.button_reply?.title.toLowerCase().trim();
      await this.handleMenuOption(fromNumber, option, message.id, shouldRemoveLastColumn); // 👈 También aquí
      await whatsappService.markAsRead(message.id);
    }
  }

  isGreeting(message) {
    const greetings = ["hola", "hello", "buen dia", "buenos días", "oye", "que tal", "hi", "hey"];
    return greetings.some(greet => message.includes(greet));
  }

  async getSenderName(senderInfo) {
    return senderInfo.profile?.name || senderInfo.wa_id || "Usuario TII";
  }

  async sendWelcomeMessage(to, messageId, senderInfo) {
    const name = await this.getSenderName(senderInfo);
    const welcomeMessage = `¡Hola *${name}*! 👋 Bienvenido al Inventario de TII. ¿En qué puedo ayudarte hoy?`;
    await whatsappService.sendMessage(to, welcomeMessage, messageId);
  }

  async sendWelcomeMenu(to) {
    try {
      const menuMessage = "📋 Menú Principal:";
      const buttons = [
        { reply: { id: 'gama_baja', title: 'INVENTARIO GAMA BAJA' } },
        { reply: { id: 'gama_alta', title: 'INVENTARIO GAMA ALTA' } },
        { reply: { id: 'buscar_modelo', title: 'BUSCAR MODELO' } }
      ];
      await whatsappService.sendInteractiveButtons(to, menuMessage, buttons);
    } catch (error) {
      console.error('Error enviando menú:', error);
      await whatsappService.sendMessage(
        to,
        "Por favor elige:\n1. INVENTARIO GAMA BAJA\n2. INVENTARIO GAMA ALTA\n3. BUSCAR MODELO"
      );
    }
  }

  async handleMenuOption(to, option, messageId, shouldRemoveLastColumn = false) { // 👈 Ahora recibe el flag
    if (option.includes("buscar modelo")) {
      await whatsappService.sendMessage(to, "Escriba el modelo que desea buscar", messageId);
    } else if (option.includes("gama baja")) {
      await this.generateImageAndSend(to, 'INVENTARIO GAMA BAJA', shouldRemoveLastColumn);
    } else if (option.includes("gama alta")) {
      await this.generateImageAndSend(to, 'INVENTARIO GAMA ALTA', shouldRemoveLastColumn);
    } else {
      await whatsappService.sendMessage(to, "Opción no reconocida.");
    }
  }

  async handleUserText(to, message, messageId, shouldRemoveLastColumn = false) { // 👈 También aquí
    await this.generateImageAndSend(to, message.toUpperCase(), shouldRemoveLastColumn);
  }

  async generateImageAndSend(to, opcion, shouldRemoveLastColumn = false) { // 👈 Y también aquí
    try {
      const scriptPath = path.resolve('python/generar_imagen.py');
      const command = `python "${scriptPath}" "${opcion}" "${shouldRemoveLastColumn}"`; // 👈 Enviamos el parámetro al script

      exec(command, async (error, stdout, stderr) => {
        if (error) {
          console.error(`Error ejecutando script: ${error.message}`);
          console.error(`Stderr: ${stderr}`);
          await whatsappService.sendMessage(to, "Ocurrió un error generando la imagen.");
          return;
        }

        // Capturar la salida del script Python
        const output = stdout.toString().trim();
        console.log(`Salida del script Python: "${output}"`);

        if (!output || !fs.existsSync(output)) {
          console.error('El script no devolvió una ruta válida o el archivo no existe');
          console.error('Ruta recibida:', output);
          await whatsappService.sendMessage(to, "Error: No se pudo generar la imagen.");
          return;
        }

        const fileName = path.basename(output);
        const fileUrl = `${config.BASE_URL}/imagenes/${fileName}`;
        console.log(`Intentando enviar imagen desde: ${fileUrl}`);

        try {
          const testResponse = await axios.head(fileUrl);
          console.log(`Test de acceso a imagen exitoso (HTTP ${testResponse.status})`);
        } catch (testError) {
          console.error('La imagen no es accesible públicamente:', testError.message);
          await whatsappService.sendMessage(to, "Error: La imagen no está disponible.");
          return;
        }

        await whatsappService.sendImage(to, fileUrl);
      });
    } catch (err) {
      console.error('Error en generateImageAndSend:', err);
      await whatsappService.sendMessage(to, "Ocurrió un error interno.");
    }
  }
}

export default new MessageHandler();

