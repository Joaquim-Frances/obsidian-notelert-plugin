import { requestUrl } from "obsidian";
import { PLUGIN_SCHEDULE_EMAIL_URL } from "../../core/config";

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
        const text = await response.text;
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
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    
    if (error instanceof DOMException && error.name === 'AbortError') {
      return {
        success: false,
        error: 'Timeout: El servidor no respondió en 25 segundos. Puede ser un cold start. Intenta de nuevo.',
      };
    }
    
    // Mejorar detección de errores de red vs errores del servidor
    const errorMessage = error instanceof Error ? error.message : String(error);
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
 * Generar un ID único para notificaciones
 */
export function generateNotificationId(): string {
  const randomPart = Math.random().toString(36).slice(2, 11);
  return `obsidian-${Date.now()}-${randomPart}`;
}

