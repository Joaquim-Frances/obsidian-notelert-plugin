import { requestUrl } from "obsidian";
import { PLUGIN_SCHEDULE_EMAIL_URL, PLUGIN_SCHEDULE_PUSH_NOTIFICATION_URL } from "../../core/config";
import { errorToString } from "./utils";
import { DetectedPattern } from "../../core/types";
import { getTranslation } from "../../i18n";

export interface ScheduleEmailResult {
  success: boolean;
  error?: string;
  notificationId?: string;
}

interface FirebaseErrorResponse {
  message?: string;
  error?: string;
}

interface FirebaseScheduleResponse {
  notificationId?: string;
  scheduledFor?: string;
}

const parseFirebaseErrorJson = JSON.parse as (text: string) => FirebaseErrorResponse;
const parseFirebaseScheduleJson = JSON.parse as (text: string) => FirebaseScheduleResponse;

function parseFirebaseErrorResponse(text: string, fallback: string): FirebaseErrorResponse {
  if (!text) {
    return { error: fallback };
  }

  try {
    return parseFirebaseErrorJson(text);
  } catch {
    return { error: fallback };
  }
}

function parseFirebaseScheduleResponse(text: string, notificationId: string): FirebaseScheduleResponse {
  if (!text) {
    return {};
  }

  try {
    return parseFirebaseScheduleJson(text);
  } catch {
    return { notificationId };
  }
}

function getFirebaseErrorMessage(errorData: FirebaseErrorResponse, fallback: string): string {
  return errorData.message || errorData.error || fallback;
}

/**
 * Programar un email usando el endpoint proxy (sin API key requerida)
 * Usa autenticación por userId/userEmail
 */
export async function scheduleEmailReminderProxy(
  title: string,
  message: string,
  scheduledDate: Date,
  notificationId: string,
  pluginToken: string,
  language = 'en'
): Promise<ScheduleEmailResult> {
  try {
    const requestBody = {
      title: title,
      message: message,
      scheduledDate: scheduledDate.toISOString(),
      notificationId: notificationId,
    };

    if (!pluginToken || pluginToken.trim() === '') {
      return {
        success: false,
        error: 'App link token requerido. Configura tu token en Settings > Notelert > App link token.'
      };
    }

    const response = await requestUrl({
      url: PLUGIN_SCHEDULE_EMAIL_URL,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-plugin-token': pluginToken, // Firebase Functions normaliza headers a minúsculas
      },
      body: JSON.stringify(requestBody),
    });

    if (response.status >= 400) {
      const errorData = parseFirebaseErrorResponse(response.text, `HTTP ${response.status}`);

      // Manejar errores específicos
      if (response.status === 400) {
        return {
          success: false,
          error: getFirebaseErrorMessage(errorData, getTranslation(language, "firebaseErrors.invalidData")),
        };
      }

      if (response.status === 403) {
        return {
          success: false,
          error: getFirebaseErrorMessage(errorData, getTranslation(language, "firebaseErrors.premiumExpired")),
        };
      }

      if (response.status === 404) {
        return {
          success: false,
          error: getFirebaseErrorMessage(errorData, getTranslation(language, "firebaseErrors.userNotFound")),
        };
      }

      if (response.status === 429) {
        return {
          success: false,
          error: getFirebaseErrorMessage(errorData, getTranslation(language, "firebaseErrors.emailLimit")),
        };
      }

      return {
        success: false,
        error: getFirebaseErrorMessage(errorData, `HTTP ${response.status}`),
      };
    }

    const result = parseFirebaseScheduleResponse(response.text, notificationId);

    return {
      success: true,
      notificationId: result.notificationId || notificationId
    };
  } catch (error) {
    // Mejorar detección de errores de red vs errores del servidor
    const errorMessage = errorToString(error);
    const isNetworkError = errorMessage.includes('Failed to fetch') ||
      errorMessage.includes('NetworkError') ||
      errorMessage.includes('Network request failed') ||
      errorMessage.includes('CORS');

    if (isNetworkError) {
      // Si es error de CORS, dar mensaje más específico
      if (errorMessage.includes('CORS')) {
        return {
          success: false,
          error: getTranslation(language, "firebaseErrors.cors"),
        };
      }
      return {
        success: false,
        error: getTranslation(language, "firebaseErrors.connection", { error: errorMessage }),
      };
    }

    return {
      success: false,
      error: errorMessage || getTranslation(language, "firebaseErrors.networkEmail"),
    };
  }
}

/**
 * Resultado de programar una notificación push
 */
export interface SchedulePushNotificationResult {
  success: boolean;
  error?: string;
  notificationId?: string;
  scheduledFor?: string;
  hasActiveDevices?: boolean;
  errorCode?: 'LINK_ERROR' | 'TOKEN_INVALID' | 'RATE_LIMIT' | 'PREMIUM_REQUIRED' | 'USER_NOT_FOUND' | 'OTHER';
}

/**
 * Interfaz para la ubicación en una notificación de tipo location
 */
interface NotificationLocation {
  latitude: number;
  longitude: number;
  address: string;
  triggerType: string;
  radius?: number;
  locationId?: string;
  name?: string;
}

/**
 * Interfaz para configuración de recurrencia
 */
interface RecurrenceConfig {
  enabled: boolean;
  interval: number;
  unit: 'day' | 'week' | 'month' | 'year';
  endType: 'never' | 'count' | 'date';
  endCount?: number;
  endDate?: string;
}

/**
 * Interfaz para el cuerpo de la petición de notificación push
 */
interface PushNotificationRequestBody {
  title: string;
  message: string;
  notificationId: string;
  type: string;
  scheduledDate?: string;
  location?: NotificationLocation;
  obsidianDeepLink?: string;
  recurrence?: RecurrenceConfig;
}

/**
 * Programar una notificación push usando el endpoint del plugin
 * Soporta notificaciones de fecha/hora y de ubicación
 */
export async function schedulePushNotification(
  pattern: DetectedPattern,
  notificationId: string,
  pluginToken: string,
  obsidianDeepLink?: string,
  language = 'en'
): Promise<SchedulePushNotificationResult> {
  try {
    if (!pluginToken || pluginToken.trim() === '') {
      return {
        success: false,
        error: getTranslation(language, "notices.tokenRequiredNotice")
      };
    }

    // Determinar el tipo de notificación
    const notificationType = pattern.type || (pattern.location ? 'location' : 'time');

    // Construir el cuerpo de la petición base
    const requestBody: PushNotificationRequestBody = {
      title: pattern.title,
      message: pattern.message,
      notificationId: notificationId,
      type: notificationType,
    };

    // Añadir datos según el tipo de notificación
    if (notificationType === 'time') {
      // Notificación de fecha/hora - scheduledDate es requerido
      const dateTimeString = `${pattern.date}T${pattern.time}:00`;
      const scheduledDate = new Date(dateTimeString);

      if (isNaN(scheduledDate.getTime())) {
        return {
          success: false,
          error: getTranslation(language, "notices.invalidDate", { date: dateTimeString }),
        };
      }

      requestBody.scheduledDate = scheduledDate.toISOString();
    } else if (notificationType === 'location') {
      // Las notificaciones de ubicación se disparan por geofencing en la app.
      // Guardamos una fecha futura solo para que aparezcan como activas.
      const scheduledDate = new Date(Date.now() + 3650 * 24 * 60 * 60 * 1000);
      requestBody.scheduledDate = scheduledDate.toISOString();
      // Notificación de ubicación
      if (!pattern.location || pattern.latitude === undefined || pattern.longitude === undefined) {
        return {
          success: false,
          error: getTranslation(language, "firebaseErrors.locationIncomplete"),
        };
      }

      requestBody.location = {
        latitude: pattern.latitude,
        longitude: pattern.longitude,
        address: pattern.location,
        triggerType: 'arrive', // Por defecto 'arrive', podría hacerse configurable en el futuro
        radius: pattern.radius,
        name: pattern.location,
      };
    } else {
      // Caso defensivo: notificationType debería ser siempre 'time' o 'location'
      // pero TypeScript lo infiere como 'never' aquí, así que lo convertimos a string
      const notificationTypeStr = String(notificationType);
      return {
        success: false,
        error: getTranslation(language, "firebaseErrors.unsupportedNotificationType", { type: notificationTypeStr }),
      };
    }

    // Añadir deep link de Obsidian si está disponible
    if (obsidianDeepLink) {
      requestBody.obsidianDeepLink = obsidianDeepLink;
    }

    // Añadir configuración de recurrencia si está habilitada
    if (pattern.recurrence?.enabled) {
      requestBody.recurrence = {
        enabled: true,
        interval: pattern.recurrence.interval,
        unit: pattern.recurrence.unit,
        endType: pattern.recurrence.endType,
        endCount: pattern.recurrence.endCount,
        endDate: pattern.recurrence.endDate,
      };
    }

    const response = await requestUrl({
      url: PLUGIN_SCHEDULE_PUSH_NOTIFICATION_URL,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-plugin-token': pluginToken, // Firebase Functions normaliza headers a minúsculas
      },
      body: JSON.stringify(requestBody),
    });

    if (response.status >= 400) {
      const errorData = parseFirebaseErrorResponse(response.text, `HTTP ${response.status}`);

      // Manejar errores específicos
      if (response.status === 400) {
        return {
          success: false,
          error: getFirebaseErrorMessage(errorData, getTranslation(language, "firebaseErrors.invalidData")),
          errorCode: 'LINK_ERROR',
        };
      }

      if (response.status === 401) {
        return {
          success: false,
          error: getFirebaseErrorMessage(errorData, getTranslation(language, "firebaseErrors.tokenInvalid")),
          errorCode: 'TOKEN_INVALID',
        };
      }

      if (response.status === 403) {
        // 403 puede ser por token inválido o por falta de premium
        const errorMsg = getFirebaseErrorMessage(errorData, getTranslation(language, "firebaseErrors.accessDenied"));
        const lowerMsg = errorMsg.toLowerCase();
        
        // Si el mensaje indica explícitamente temas de premium/suscripción, es PREMIUM_REQUIRED
        if (
          lowerMsg.includes('premium') || 
          lowerMsg.includes('suscrip') || 
          lowerMsg.includes('subscription') || 
          lowerMsg.includes('expir')
        ) {
          return {
            success: false,
            error: errorMsg,
            errorCode: 'PREMIUM_REQUIRED',
          };
        }
        
        // En cualquier otro caso (token no encontrado, inválido, expirado, o error genérico 403),
        // devolvemos TOKEN_INVALID para que el usuario reciba la sugerencia de regenerar el token.
        return {
          success: false,
          error: errorMsg,
          errorCode: 'TOKEN_INVALID',
        };
      }

      if (response.status === 404) {
        return {
          success: false,
          error: getFirebaseErrorMessage(errorData, getTranslation(language, "firebaseErrors.userNotFound")),
          errorCode: 'USER_NOT_FOUND',
        };
      }

      if (response.status === 429) {
        return {
          success: false,
          error: getFirebaseErrorMessage(errorData, getTranslation(language, "firebaseErrors.notificationLimit")),
          errorCode: 'RATE_LIMIT',
        };
      }

      return {
        success: false,
        error: getFirebaseErrorMessage(errorData, `Error desconocido (HTTP ${response.status})`),
        errorCode: 'OTHER',
      };
    }

    const result = parseFirebaseScheduleResponse(response.text, notificationId);
    let hasActiveDevices = true;
    try {
      const responseJson = JSON.parse(response.text);
      if (responseJson && typeof responseJson.hasActiveDevices === 'boolean') {
        hasActiveDevices = responseJson.hasActiveDevices;
      }
    } catch (e) {
      // Ignorar fallo en parseo de JSON
    }

    return {
      success: true,
      notificationId: result.notificationId || notificationId,
      scheduledFor: result.scheduledFor,
      hasActiveDevices,
    };
  } catch (error) {

    // Mejorar detección de errores de red vs errores del servidor
    const errorMessage = errorToString(error);
    const isNetworkError = errorMessage.includes('Failed to fetch') ||
      errorMessage.includes('NetworkError') ||
      errorMessage.includes('Network request failed') ||
      errorMessage.includes('CORS');

    if (isNetworkError) {
      // Si es error de CORS, dar mensaje más específico
      if (errorMessage.includes('CORS')) {
        return {
          success: false,
          error: getTranslation(language, "firebaseErrors.cors"),
        };
      }
      return {
        success: false,
        error: getTranslation(language, "firebaseErrors.connection", { error: errorMessage }),
      };
    }

    return {
      success: false,
      error: errorMessage || getTranslation(language, "firebaseErrors.networkPush"),
    };
  }
}

/**
 * Generar un ID único para notificaciones
 */
export function generateNotificationId(): string {
  const randomPart = Math.random().toString(36).slice(2, 11);
  return `obsidian-${Date.now()}-${randomPart}`;
}
