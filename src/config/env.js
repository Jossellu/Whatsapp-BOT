import dotenv from 'dotenv';

dotenv.config();

export default {
  WEBHOOK_VERIFY_TOKEN: process.env.WEBHOOK_VERIFY_TOKEN,
  API_TOKEN: process.env.API_TOKEN,
  BUSINESS_PHONE: process.env.BUSINESS_PHONE,
  API_VERSION: process.env.API_VERSION,
  PORT: process.env.PORT || 3000,
  BASE_URL: process.env.BASE_URL,

  //otras configuraciones de limpieza
  IMAGE_CLEANUP: {
    MAX_AGE_HOURS: 24,    // Máxima antigüedad permitida
    INTERVAL_HOURS: 6,    // Frecuencia de limpieza
    DRY_RUN: false        // true para solo mostrar qué se borraría
  }
};
