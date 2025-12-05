/**
 * Utilidades para manejo de fechas y horas
 */

/**
 * Obtiene la fecha de hoy en formato ISO (YYYY-MM-DD)
 */
export function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Obtiene la fecha de mañana en formato ISO (YYYY-MM-DD)
 */
export function getTomorrow(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}

/**
 * Obtiene la hora actual más N horas en formato HH:MM
 */
export function getTimeInHours(hours: number): string {
  const now = new Date();
  now.setHours(now.getHours() + hours);
  return now.toTimeString().slice(0, 5);
}

/**
 * Obtiene la hora inicial sugerida (hora actual + 1 hora, redondeada a múltiplos de 5 minutos)
 */
export function getInitialTime(): { hours: number; minutes: number } {
  const now = new Date();
  now.setHours(now.getHours() + 1);
  const hours = now.getHours();
  const minutes = Math.ceil(now.getMinutes() / 5) * 5;
  return { hours, minutes };
}

