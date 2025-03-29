import whatsappService from './whatsappService.js';

class MessageHandler {
  async handleIncomingMessage(message, senderInfo) {
    if (message?.type === "text") {
      const incomingMessage = message.text.body.toLowerCase().trim();
      // Remove 1 from the position 2 in the from property
      const fromNumber = message.from.slice(0, 2) + message.from.slice(3);

      if (this.isGreeting(incomingMessage)) {
        await this.sendWelcomeMessage(fromNumber, message.id, senderInfo);
      } else {
        const response = `Echo: ${message.text.body}`;
        await whatsappService.sendMessage(fromNumber, response, message.id);
      }

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
    try {
      const name = await this.getSenderName(senderInfo);
      const welcomeMessage = `¡Hola *${name}*! 👋 Bienvenido al Inventario de TII. ¿En qué puedo ayudarte hoy?`;
      
      // Enviamos el mensaje de bienvenida primero
      await whatsappService.sendMessage(to, welcomeMessage, messageId);
      
      // Luego enviamos el menú interactivo
      await this.sendWelcomeMenu(to);
    } catch (error) {
      console.error("Error al enviar mensaje de bienvenida:", error);
      // Fallback: enviar mensaje simple si falla el interactivo
      await whatsappService.sendMessage(
        to,
        "Por favor elige una opción:\n1. INVENTARIO DEL DIA\n2. INVENTARIO GAMA MEDIA\n3. INVENTARIO GAMA ALTA",
        messageId
      );
    }
  }

  async sendWelcomeMenu(to) {
    const menuMessage = "Selecciona una opción del menú:";
    const buttons = [
      { id: 'option_1', title: 'INVENTARIO DEL DIA' },
      { id: 'option_2', title: 'INVENTARIO GAMA MEDIA' },
      { id: 'option_3', title: 'INVENTARIO GAMA ALTA' }
    ];

    await whatsappService.sendInteractiveButtons(
      to,
      menuMessage,
      buttons,
      "📋 Menú Principal" // Encabezado opcional
    );
  }

  async handleRegularMessage(message) {
    // Respuesta para mensajes no reconocidos
    const response = `Recibí tu mensaje: "${message.text.body}".\n\n` + 
                    "Escribe *HOLA* para ver las opciones disponibles.";
    
    await whatsappService.sendMessage(
      message.from,
      response,
      message.id
    );
  }
}

export default new MessageHandler();