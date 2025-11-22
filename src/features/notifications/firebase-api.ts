import { Notice } from "obsidian";
import { ScheduledEmail } from "../../core/types";
import { getTranslation } from "../../i18n";
import { FIREBASE_FUNCTION_BASE_URL, PLUGIN_SCHEDULE_EMAIL_URL } from "../../core/config";

const SCHEDULE_EMAIL_URL = `${FIREBASE_FUNCTION_BASE_URL}/scheduleEmailReminder`;
const CANCEL_EMAIL_URL = `${FIREBASE_FUNCTION_BASE_URL}/cancelScheduledEmail`;

export interface ScheduleEmailResult {
  success: boolean;
  error?: string;
  notificationId?: string;
}

export interface CancelEmailResult {
  success: boolean;
  error?: string;
}

// Timeout aumentado para cold starts en Firebase Functions (25 segundos)
// Los cold starts pueden tardar 10-20 segundos en inicializar
const REQUEST_TIMEOUT = 25000;

/**
 * Programar un email de recordatorio usando Firebase Functions
 */
export async function scheduleEmailReminder(
  userEmail: string,
  title: string,
  message: string,
  scheduledDate: Date,
  notificationId: string,
  apiKey: string,
  userId?: string
): Promise<ScheduleEmailResult> {
  // Crear AbortController para timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const requestBody = {
      to: userEmail,
      title: title,
      message: message,
      scheduledDate: scheduledDate.toISOString(), // Formato ISO 8601
      notificationId: notificationId,
      userId: userId || null,
    };

    // Logs solo en modo debug (reducir overhead)
    if (process.env.NODE_ENV === 'development') {
      console.log('[Notelert] Enviando request a:', SCHEDULE_EMAIL_URL);
    }

    // Usar keepalive para mejorar rendimiento en conexiones lentas
    const response = await fetch(SCHEDULE_EMAIL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
      keepalive: true, // Mantener conexión viva para mejor rendimiento
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorData;
      try {
        // Intentar parsear JSON con timeout implícito
        const text = await response.text();
        errorData = text ? JSON.parse(text) : { error: `HTTP ${response.status}` };
      } catch (e) {
        errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
      }
      
      // Manejar errores específicos
      if (response.status === 401) {
        return {
          success: false,
          error: errorData.error || errorData.message || 'API Key inválida o faltante',
        };
      }
      
      if (response.status === 429) {
        return {
          success: false,
          error: errorData.error || errorData.message || 'Límite de emails alcanzado (máximo 100)',
        };
      }
      
      if (response.status === 408 || response.status === 504) {
        return {
          success: false,
          error: 'El servidor tardó demasiado en responder. Intenta de nuevo.',
        };
      }
      
      return {
        success: false,
        error: errorData.error || errorData.message || `HTTP ${response.status}`,
      };
    }

    // Parsear respuesta de forma optimizada
    let result;
    try {
      const text = await response.text();
      result = text ? JSON.parse(text) : {};
    } catch (e) {
      // Si no hay respuesta JSON, asumir éxito con el ID proporcionado
      result = { notificationId: notificationId };
    }
    
    return { 
      success: true,
      notificationId: result.notificationId || notificationId
    };
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      return {
        success: false,
        error: 'Timeout: El servidor no respondió en 25 segundos. Puede ser un cold start. Intenta de nuevo.',
      };
    }
    
    // Detectar errores de red comunes
    if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
      return {
        success: false,
        error: 'Error de conexión. Verifica tu internet e intenta de nuevo.',
      };
    }
    
    return {
      success: false,
      error: error.message || 'Error de red al programar email',
    };
  }
}

/**
 * Cancelar un email programado
 */
export async function cancelScheduledEmail(
  notificationId: string,
  apiKey: string,
  userId?: string
): Promise<CancelEmailResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(CANCEL_EMAIL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify({
        notificationId: notificationId,
        userId: userId || null,
      }),
      signal: controller.signal,
      keepalive: true, // Mantener conexión viva para mejor rendimiento
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorData;
      try {
        const text = await response.text();
        errorData = text ? JSON.parse(text) : { error: `HTTP ${response.status}` };
      } catch (e) {
        errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
      }
      
      if (response.status === 401) {
        return {
          success: false,
          error: errorData.error || errorData.message || 'API Key inválida o faltante',
        };
      }
      
      if (response.status === 404) {
        return {
          success: false,
          error: errorData.error || errorData.message || 'Email programado no encontrado',
        };
      }
      
      if (response.status === 408 || response.status === 504) {
        return {
          success: false,
          error: 'El servidor tardó demasiado en responder. Intenta de nuevo.',
        };
      }
      
      return {
        success: false,
        error: errorData.error || errorData.message || `HTTP ${response.status}`,
      };
    }

    return { success: true };
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      return {
        success: false,
        error: 'Timeout: El servidor no respondió en 25 segundos. Puede ser un cold start. Intenta de nuevo.',
      };
    }
    
    // Detectar errores de red comunes
    if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
      return {
        success: false,
        error: 'Error de conexión. Verifica tu internet e intenta de nuevo.',
      };
    }
    
    return {
      success: false,
      error: error.message || 'Error de red al cancelar email',
    };
  }
}

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

    const response = await fetch(PLUGIN_SCHEDULE_EMAIL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Plugin-Token': pluginToken,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
      keepalive: true,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorData;
      try {
        const text = await response.text();
        errorData = text ? JSON.parse(text) : { error: `HTTP ${response.status}` };
      } catch (e) {
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
    } catch (e) {
      result = { notificationId: notificationId };
    }
    
    return { 
      success: true,
      notificationId: result.notificationId || notificationId
    };
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      return {
        success: false,
        error: 'Timeout: El servidor no respondió en 25 segundos. Puede ser un cold start. Intenta de nuevo.',
      };
    }
    
    if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
      return {
        success: false,
        error: 'Error de conexión. Verifica tu internet e intenta de nuevo.',
      };
    }
    
    return {
      success: false,
      error: error.message || 'Error de red al programar email',
    };
  }
}

/**
 * Generar un ID único para notificaciones
 */
export function generateNotificationId(): string {
  return `obsidian-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

