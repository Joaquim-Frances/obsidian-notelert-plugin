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
export const PLUGIN_REQUEST_EMAIL_VERIFICATION_URL = `${FIREBASE_FUNCTION_BASE_URL}/pluginRequestEmailVerification`;
export const PLUGIN_VERIFY_NOTIFICATION_EMAIL_URL = `${FIREBASE_FUNCTION_BASE_URL}/pluginVerifyNotificationEmail`;
export const PLUGIN_GET_NOTIFICATION_EMAIL_URL = `${FIREBASE_FUNCTION_BASE_URL}/pluginGetNotificationEmail`;
export const PLUGIN_GET_ACCOUNT_SUMMARY_URL = `${FIREBASE_FUNCTION_BASE_URL}/pluginGetAccountSummary`;
export const PLUGIN_REQUEST_ACCOUNT_ACTION_URL = `${FIREBASE_FUNCTION_BASE_URL}/pluginRequestAccountAction`;
export const PLUGIN_CONFIRM_ACCOUNT_ACTION_URL = `${FIREBASE_FUNCTION_BASE_URL}/pluginConfirmAccountAction`;
export const PLUGIN_REVOKE_INSTALLATION_URL = `${FIREBASE_FUNCTION_BASE_URL}/pluginRevokeInstallation`;
export const PLUGIN_CREATE_STRIPE_CHECKOUT_URL = `${FIREBASE_FUNCTION_BASE_URL}/pluginCreateStripeCheckout`;
export const PLUGIN_CREATE_STRIPE_PORTAL_URL = `${FIREBASE_FUNCTION_BASE_URL}/pluginCreateStripePortal`;

export const NOTELERT_PRIVACY_URL = 'https://notelert.com/privacy/';
export const NOTELERT_TERMS_URL = 'https://notelert.com/terms/';
export const NOTELERT_DELETE_ACCOUNT_URL = 'https://notelert.com/delete-account/';

// URL del endpoint para listar ubicaciones guardadas del usuario (para el plugin)
export const PLUGIN_LIST_LOCATIONS_URL = `${FIREBASE_FUNCTION_BASE_URL}/pluginListLocations`;

// URL del endpoint para programar notificaciones push desde el plugin
export const PLUGIN_SCHEDULE_PUSH_NOTIFICATION_URL = `${FIREBASE_FUNCTION_BASE_URL}/pluginSchedulePushNotification`;
export const PLUGIN_GOOGLE_CALENDAR_CONNECTION_URL = `${FIREBASE_FUNCTION_BASE_URL}/pluginGoogleCalendarConnection`;
export const PLUGIN_SCHEDULE_GOOGLE_CALENDAR_URL = `${FIREBASE_FUNCTION_BASE_URL}/pluginScheduleGoogleCalendar`;
export const PLUGIN_TELEGRAM_CONNECTION_URL = `${FIREBASE_FUNCTION_BASE_URL}/pluginTelegramConnection`;
export const PLUGIN_SCHEDULE_TELEGRAM_URL = `${FIREBASE_FUNCTION_BASE_URL}/pluginScheduleTelegram`;
