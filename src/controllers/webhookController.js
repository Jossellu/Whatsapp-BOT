import config from '../config/env.js';
import messageHandler from '../services/messageHandler.js';
import authorizedNumbers from '../config/authorizedNumbers.js'; // 👈 NUEVO IMPORT

class WebhookController {
  async handleIncoming(req, res) {
    const message = req.body.entry?.[0]?.changes[0]?.value?.messages?.[0];
    const senderInfo = req.body.entry?.[0]?.changes[0]?.value?.contacts?.[0];

    if (message && senderInfo) {
      const rawNumber = senderInfo.wa_id; // Ejemplo: "5219711198002"

      // Normalizar el número
      const normalizedNumber = rawNumber;

      // Revisar si está autorizado
      const isAuthorized = [
        ...authorizedNumbers.generales,
        ...authorizedNumbers.eliminarUltimaColumna
      ].includes(normalizedNumber);

      if (!isAuthorized) {
        console.log(`❌ Número no autorizado (raw: ${rawNumber}, normalized: ${normalizedNumber})`);
        return res.sendStatus(403); // Rechazar solicitud
      }

      // Revisar si este usuario debe ocultar la última columna
      const shouldRemoveLastColumn = authorizedNumbers.eliminarUltimaColumna.includes(normalizedNumber);

      // Llamar al messageHandler y pasarle el flag
      await messageHandler.handleIncomingMessage(message, senderInfo, shouldRemoveLastColumn);
    }

    res.sendStatus(200);
  }

  verifyWebhook(req, res) {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === config.WEBHOOK_VERIFY_TOKEN) {
      res.status(200).send(challenge);
      console.log('Webhook verified successfully!');
    } else {
      res.sendStatus(403);
    }
  }
}

export default new WebhookController();
