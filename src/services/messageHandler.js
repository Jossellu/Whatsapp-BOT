import whatsappService from './whatsappService.js';

const cleanPhoneNumber = (number) => {
  // Elimina todo lo que no sea dígito y remueve el 3er dígito (ej: 521 → 52)
  const digits = number.replace(/\D/g, '');
  return digits.length >= 3 
    ? digits.slice(0, 2) + digits.slice(3) 
    : digits;
};

class MessageHandler {
  async handleIncomingMessage(message) {
    if (message?.type !== 'text' || !message.text?.body) {
      throw new Error("Mensaje no válido");
    }

    const incomingMessage = message.text.body.toLowerCase().trim();
    const phoneNumber = cleanPhoneNumber(message.from);

    try {
      if (this.isGreeting(incomingMessage)) {
        await this.sendWelcomeMessage(phoneNumber, message.id);
      } else {
        await whatsappService.sendMessage(
          phoneNumber,
          `Echo: ${message.text.body}`,
          message.id
        );
      }
      await whatsappService.markAsRead(message.id);
    } catch (error) {
      console.error("Error al manejar el mensaje:", error);
      throw error; // Opcional: relanzar el error para manejarlo arriba
    }
  }

  isGreeting(message) {
    const greetings = ["hola", "hello", "buen dia", "oye", "que tal"];
    return greetings.some(greet => 
      message.toLowerCase().includes(greet.toLowerCase())
    ); // <- Comparación insensible a mayúsculas
  }

  async sendWelcomeMessage(to, messageId) {
    const welcomeMessage = "Hola, bienvenido al Inventario de TII. ¿En qué puedo ayudarte hoy?";
    await whatsappService.sendMessage(to, welcomeMessage, messageId);
  }
}

export default new MessageHandler();