import whatsappService from './whatsappService.js';
import { generarExcelFiltrado } from './utils/excelProcessor.js';

class MessageHandler {
  async handleIncomingMessage(message, senderInfo) {
    // Mueve esta línea fuera del bloque
    const fromNumber = message.from.slice(0, 2) + message.from.slice(3);
  
    if (message?.type === "text") {
      const incomingMessage = message.text.body.toLowerCase().trim();
  
      if (this.isGreeting(incomingMessage)) {
        await this.sendWelcomeMessage(fromNumber, message.id, senderInfo);
        await this.sendWelcomeMenu(fromNumber);
      } else {
        const response = `Echo: ${message.text.body}`;
        await whatsappService.sendMessage(fromNumber, response, message.id);
      }
  
      await whatsappService.markAsRead(message.id);
  
    } else if (message?.type == 'interactive') {
      const option = message?.interactive?.button_reply?.title.toLowerCase().trim();
      await this.handleMenuOption(fromNumber, option);
      await whatsappService.markAsRead(message.id);
    }
  }

  isGreeting(message) {
    const greetings = ["hola", "hello", "buen dia", "buenos días", "oye", "que tal", "hi", "hey"];
    return greetings.some(greet => message.includes(greet));
  }

  async getSenderName(senderInfo) {
    return senderInfo.profile?.name || senderInfo.wa_id || "Usuario TII"
  }

  async sendWelcomeMessage(to, messageId, senderInfo) {
      const name = await this.getSenderName(senderInfo);
      const welcomeMessage = `¡Hola *${name}*! 👋 Bienvenido al Inventario de TII. ¿En qué puedo ayudarte hoy?`;
      // Enviamos el mensaje de bienvenida primero
      await whatsappService.sendMessage(to, welcomeMessage, messageId);
  }

  async sendWelcomeMenu(to) {
    try {
      const menuMessage = "📋 Menú Principal:";
      const buttons = [
        {
          reply: { // Cambiado a estructura correcta
            id: 'inventario_dia',
            title: 'INVENTARIO DEL DIA' 
          }
        },
        {
          reply: {
            id: 'inventario_media',
            title: 'GAMA MEDIA' 
          }
        },
        {
          reply: {
            id: 'inventario_alta',
            title: 'GAMA ALTA' 
          }
        }
      ];
  
      await whatsappService.sendInteractiveButtons(to, menuMessage, buttons);
    } catch (error) {
      console.error('Error enviando menú:', error);
      // Fallback: envía mensaje plano si fallan los botones
      await whatsappService.sendMessage(
        to,
        "Por favor elige:\n1. INVENTARIO DEL DIA\n2. GAMA MEDIA\n3. GAMA ALTA"
      );
    }
  }

  async handleMenuOption(to, option) {
    let response;
    let fileUrl;
  
    try {
      // Llama al generador según la opción
      const relativePath = generarExcelFiltrado(option.toUpperCase());
      fileUrl = `http://localhost:3000${relativePath}`;
  
      response = `Aquí está el reporte solicitado: ${option}`;
      await whatsappService.sendMessage(to, response);
      await whatsappService.sendDocument(to, fileUrl); // 👈 necesitas implementar esta función si no la tienes
    } catch (err) {
      console.error('Error generando archivo:', err);
      response = "Ocurrió un error generando tu archivo. Intenta más tarde.";
      await whatsappService.sendMessage(to, response);
    }
  }
  
}

export default new MessageHandler();