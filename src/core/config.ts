/**
 * Configuración por defecto del plugin
 * 
 * NOTA: Las API Keys ya NO están hardcodeadas por seguridad.
 * El plugin usa endpoints proxy en Firebase Functions que ocultan las keys.
 */

// URL base de Firebase Functions
const FIREBASE_FUNCTION_BASE_URL = 'https://us-central1-notalert-2a44a.cloudfunctions.net';

// URL del endpoint proxy para programar emails (sin API key requerida, usa plugin token)
export const PLUGIN_SCHEDULE_EMAIL_URL = `${FIREBASE_FUNCTION_BASE_URL}/pluginScheduleEmail`;

// URL del endpoint para listar ubicaciones guardadas del usuario (para el plugin)
export const PLUGIN_LIST_LOCATIONS_URL = `${FIREBASE_FUNCTION_BASE_URL}/pluginListLocations`;

