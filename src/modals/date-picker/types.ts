/**
 * Tipos compartidos para el DatePickerModal
 */

/**
 * Interfaz para errores premium que extienden Error con propiedades adicionales
 */
export interface PremiumError extends Error {
  status: number;
  errorData?: {
    message?: string;
    error?: string;
  };
}

/**
 * Type guard para verificar si un error es un PremiumError
 */
export function isPremiumError(error: unknown): error is PremiumError {
  return error instanceof Error && 
    'status' in error && 
    typeof (error as PremiumError).status === 'number' &&
    (error.message === 'PREMIUM_REQUIRED' || (error as PremiumError).status === 403);
}

/**
 * Tipo de notificación
 */
export type NotificationType = 'time' | 'location';

