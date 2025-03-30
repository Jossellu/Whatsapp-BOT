import axios from 'axios';
import config from '../config/env.js';

class WhatsAppService {
  async sendMessage(to, body, messageId) {
    try {
      await axios({
        method: 'POST',
        url: `https://graph.facebook.com/${config.API_VERSION}/${config.BUSINESS_PHONE}/messages`,
        headers: {
          Authorization: `Bearer ${config.API_TOKEN}`,
        },
        data: {
          messaging_product: 'whatsapp',
          to,
          text: { body },

        },
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  async markAsRead(messageId) {
    try {
      await axios({
        method: 'POST',
        url: `https://graph.facebook.com/${config.API_VERSION}/${config.BUSINESS_PHONE}/messages`,
        headers: {
          Authorization: `Bearer ${config.API_TOKEN}`,
        },
        data: {
          messaging_product: 'whatsapp',
          status: 'read',
          message_id: messageId,
        },
      });
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }

  async sendInteractiveButtons(to, bodyText, buttons) {
    try {
      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual', // ¡Campo requerido!
        to: to.replace(/\D/g, ''), // Limpia el número
        type: 'interactive',
        interactive: {
          type: 'button',
          body: { 
            text: bodyText.substring(0, 1024) // Limita caracteres
          },
          action: {
            buttons: buttons.slice(0, 3).map(button => ({ // Máx 3 botones
              type: 'reply',
              reply: {
                id: button.reply.id.replace(/\s/g, '_').substring(0, 256), // Formato ID
                title: button.reply.title.substring(0, 20) // Máx 20 chars
              }
            }))
          }
        }
      };
  
      const response = await axios({
        method: 'POST',
        url: `https://graph.facebook.com/${config.API_VERSION}/${config.BUSINESS_PHONE}/messages`,
        headers: {
          Authorization: `Bearer ${config.API_TOKEN}`,
          'Content-Type': 'application/json' // ¡Importante!
        },
        data: payload
      });
      
      return response.data;
    } catch (error) {
      console.error('Error al enviar botones:');
      console.error('Request:', error.config?.data);
      console.error('Response:', error.response?.data || error.message);
      throw error;
    }
  }

}

export default new WhatsAppService();