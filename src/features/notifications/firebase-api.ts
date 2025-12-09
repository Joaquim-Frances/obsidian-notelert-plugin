import { requestUrl } from "obsidian";
import { PLUGIN_SCHEDULE_EMAIL_URL, PLUGIN_SCHEDULE_PUSH_NOTIFICATION_URL } from "../../core/config";
import { errorToString } from "./utils";
import { DetectedPattern } from "../../core/types";

export interface ScheduleEmailResult {
  success: boolean;
  error?: string;
  notificationId?: string;
}

// Timeout aumentado para cold starts en Firebase Functions (25 segundos)
// Los cold starts pueden tardar 10-20 segundos en inicializar
const REQUEST_TIMEOUT = 25000;

/**
 * Programar un email usando el endpoint proxy (sin API key requerida)
 * Usa autenticación por userId/userEmail
 */
export async function scheduleEmailReminderProxy(
  userEmail: string,
  title: string,
  message: string,
  scheduledDate: Date,
  notificationId: string,
  pluginToken: string
): Promise<ScheduleEmailResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const requestBody = {
      to: userEmail,
      title: title,
      message: message,
      scheduledDate: scheduledDate.toISOString(),
      notificationId: notificationId,
      userEmail: userEmail, // Requerido para autenticación (deprecated, ahora se usa token)
    };

    if (!pluginToken || pluginToken.trim() === '') {
      return {
        success: false,
        error: 'Token del plugin requerido. Configura tu token en Settings > Notelert > Plugin Token.'
      };
    }

    const response = await requestUrl({
      url: PLUGIN_SCHEDULE_EMAIL_URL,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Plugin-Token': pluginToken,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status >= 400) {
      let errorData;
      try {
        const text = await response.text();
        errorData = text ? JSON.parse(text) : { error: `HTTP ${response.status}` };
      } catch {
        errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
      }
      
      // Manejar errores específicos
      if (response.status === 400) {
        return {
          success: false,
          error: errorData.message || errorData.error || 'Datos inválidos',
        };
      }
      
      if (response.status === 403) {
        return {
          success: false,
          error: errorData.message || errorData.error || 'Usuario no es premium o suscripción expirada',
        };
      }
      
      if (response.status === 404) {
        return {
          success: false,
          error: errorData.message || errorData.error || 'Usuario no encontrado. Debes registrarte primero en la app móvil.',
        };
      }
      
      if (response.status === 429) {
        return {
          success: false,
          error: errorData.message || errorData.error || 'Límite de emails alcanzado (máximo 100)',
        };
      }
      
      return {
        success: false,
        error: errorData.message || errorData.error || `HTTP ${response.status}`,
      };
    }

    let result;
    try {
      const text = await response.text();
      result = text ? JSON.parse(text) : {};
    } catch {
      result = { notificationId: notificationId };
    }
    
    return { 
      success: true,
      notificationId: result.notificationId || notificationId
    };
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    
    if (error instanceof DOMException && error.name === 'AbortError') {
      return {
        success: false,
        error: 'Timeout: El servidor no respondió en 25 segundos. Puede ser un cold start. Intenta de nuevo.',
      };
    }
    
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
          error: 'Error de CORS. El servidor no permite la petición. Verifica la configuración del token.',
        };
      }
      return {
        success: false,
        error: `Error de conexión: ${errorMessage}. Verifica tu internet e intenta de nuevo.`,
      };
    }
    
    return {
      success: false,
      error: errorMessage || 'Error de red al programar email',
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
}

/**
 * Interfaz para la ubicación en una notificación de tipo location
 */
interface NotificationLocation {
  latitude: number;
  longitude: number;
  address: string;
  triggerType: string;
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
}

/**
 * Programar una notificación push usando el endpoint del plugin
 * Soporta notificaciones de fecha/hora y de ubicación
 */
export async function schedulePushNotification(
  pattern: DetectedPattern,
  notificationId: string,
  pluginToken: string,
  obsidianDeepLink?: string
): Promise<SchedulePushNotificationResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    if (!pluginToken || pluginToken.trim() === '') {
      return {
        success: false,
        error: 'Token del plugin requerido. Configura tu token en Settings > Notelert > Plugin Token.'
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
          error: `Fecha inválida: ${dateTimeString}`,
        };
      }

      requestBody.scheduledDate = scheduledDate.toISOString();
    } else if (notificationType === 'location') {
      // Notificación de ubicación - scheduledDate es requerido por el backend
      // Usar fecha/hora del pattern si está disponible, sino usar fecha actual
      let scheduledDate: Date;
      const patternDate = pattern.date;
      const patternTime = pattern.time;
      if (patternDate && patternTime && typeof patternDate === 'string' && typeof patternTime === 'string') {
        const dateTimeString = `${patternDate}T${patternTime}:00`;
        scheduledDate = new Date(dateTimeString);
        if (isNaN(scheduledDate.getTime())) {
          scheduledDate = new Date(); // Fallback a fecha actual
        }
      } else {
        scheduledDate = new Date(); // Usar fecha actual si no hay fecha en el pattern
      }
      requestBody.scheduledDate = scheduledDate.toISOString();
      // Notificación de ubicación
      if (!pattern.location || pattern.latitude === undefined || pattern.longitude === undefined) {
        return {
          success: false,
          error: 'Datos de ubicación incompletos. Se requiere nombre, latitud y longitud.',
        };
      }

      requestBody.location = {
        latitude: pattern.latitude,
        longitude: pattern.longitude,
        address: pattern.location,
        triggerType: 'arrive', // Por defecto 'arrive', podría hacerse configurable en el futuro
      };
    } else {
      return {
        success: false,
        error: `Tipo de notificación no soportado: ${notificationType}`,
      };
    }

    // Añadir deep link de Obsidian si está disponible
    if (obsidianDeepLink) {
      requestBody.obsidianDeepLink = obsidianDeepLink;
    }

    const response = await requestUrl({
      url: PLUGIN_SCHEDULE_PUSH_NOTIFICATION_URL,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Plugin-Token': pluginToken,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status >= 400) {
      let errorData;
      try {
        const text = await response.text();
        errorData = text ? JSON.parse(text) : { error: `HTTP ${response.status}` };
      } catch {
        errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
      }
      
      // Manejar errores específicos
      if (response.status === 400) {
        return {
          success: false,
          error: errorData.message || errorData.error || 'Datos inválidos',
        };
      }
      
      if (response.status === 401) {
        return {
          success: false,
          error: errorData.message || errorData.error || 'Token inválido o expirado',
        };
      }
      
      if (response.status === 404) {
        return {
          success: false,
          error: errorData.message || errorData.error || 'Usuario no encontrado. Debes registrarte primero en la app móvil.',
        };
      }
      
      if (response.status === 429) {
        return {
          success: false,
          error: errorData.message || errorData.error || 'Límite de notificaciones alcanzado (máximo 100/mes para usuarios free)',
        };
      }
      
      return {
        success: false,
        error: errorData.message || errorData.error || `HTTP ${response.status}`,
      };
    }

    let result;
    try {
      const text = await response.text();
      result = text ? JSON.parse(text) : {};
    } catch {
      result = { notificationId: notificationId };
    }
    
    return { 
      success: true,
      notificationId: result.notificationId || notificationId,
      scheduledFor: result.scheduledFor,
    };
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    
    if (error instanceof DOMException && error.name === 'AbortError') {
      return {
        success: false,
        error: 'Timeout: El servidor no respondió en 25 segundos. Puede ser un cold start. Intenta de nuevo.',
      };
    }
    
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
          error: 'Error de CORS. El servidor no permite la petición. Verifica la configuración del token.',
        };
      }
      return {
        success: false,
        error: `Error de conexión: ${errorMessage}. Verifica tu internet e intenta de nuevo.`,
      };
    }
    
    return {
      success: false,
      error: errorMessage || 'Error de red al programar notificación push',
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

