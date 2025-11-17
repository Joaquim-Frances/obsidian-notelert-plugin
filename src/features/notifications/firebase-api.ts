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
  try {
    const response = await fetch(SCHEDULE_EMAIL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify({
        to: userEmail,
        title: title,
        message: message,
        scheduledDate: scheduledDate.toISOString(), // Formato ISO 8601
        notificationId: notificationId,
        userId: userId || null,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || errorData.message || `HTTP ${response.status}`,
      };
    }

    const result = await response.json();
    return { 
      success: true,
      notificationId: result.notificationId || notificationId
    };
  } catch (error: any) {
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
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || errorData.message || `HTTP ${response.status}`,
      };
    }

    return { success: true };
  } catch (error: any) {
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

