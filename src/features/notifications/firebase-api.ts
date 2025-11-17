import { Notice } from "obsidian";
import { ScheduledEmail } from "../../core/types";
import { getTranslation } from "../../i18n";
import { FIREBASE_FUNCTION_BASE_URL } from "../../core/config";

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

// Timeout recomendado: 10 segundos
const REQUEST_TIMEOUT = 10000;

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

    console.log('[Notelert] Enviando request a:', SCHEDULE_EMAIL_URL);
    console.log('[Notelert] Body:', JSON.stringify(requestBody, null, 2));
    console.log('[Notelert] API Key presente:', !!apiKey);

    const response = await fetch(SCHEDULE_EMAIL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey, // Puede ser X-API-Key o x-api-key (ambas funcionan)
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log('[Notelert] Response status:', response.status);
    console.log('[Notelert] Response ok:', response.ok);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
      }
      console.error('[Notelert] Error response:', errorData);
      
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
      
      return {
        success: false,
        error: errorData.error || errorData.message || `HTTP ${response.status}`,
      };
    }

    const result = await response.json();
    console.log('[Notelert] Success response:', result);
    return { 
      success: true,
      notificationId: result.notificationId || notificationId
    };
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      console.error('[Notelert] Timeout: El servidor no respondió en 10 segundos');
      return {
        success: false,
        error: 'Timeout: El servidor no respondió en 10 segundos',
      };
    }
    
    console.error('[Notelert] Fetch error:', error);
    console.error('[Notelert] Error message:', error.message);
    console.error('[Notelert] Error stack:', error.stack);
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
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
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
        error: 'Timeout: El servidor no respondió en 10 segundos',
      };
    }
    
    return {
      success: false,
      error: error.message || 'Error de red al cancelar email',
    };
  }
}

/**
 * Generar un ID único para notificaciones
 */
export function generateNotificationId(): string {
  return `obsidian-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

