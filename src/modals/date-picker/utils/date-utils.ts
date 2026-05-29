/**
 * Utilidades para manejo de fechas y horas
 */

/**
 * Obtiene la fecha de hoy en formato ISO (YYYY-MM-DD)
 */
export function getToday(): string {
  return formatDateForInput(new Date());
}

/**
 * Obtiene la fecha de mañana en formato ISO (YYYY-MM-DD)
 */
export function getTomorrow(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return formatDateForInput(tomorrow);
}

/**
 * Comprueba si una fecha y hora seleccionadas ya han pasado.
 */
export function isDateTimeInPast(date: string, time: string, now: Date = new Date()): boolean {
  const selectedDateTime = parseDateTimeInput(date, time);

  if (!selectedDateTime) {
    return false;
  }

  return selectedDateTime.getTime() <= now.getTime();
}

function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function parseDateTimeInput(date: string, time: string): Date | null {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(time);

  if (!dateMatch || !timeMatch) {
    return null;
  }

  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]) - 1;
  const day = Number(dateMatch[3]);
  const hours = Number(timeMatch[1]);
  const minutes = Number(timeMatch[2]);
  const selectedDateTime = new Date(year, month, day, hours, minutes, 0, 0);

  if (
    selectedDateTime.getFullYear() !== year ||
    selectedDateTime.getMonth() !== month ||
    selectedDateTime.getDate() !== day ||
    selectedDateTime.getHours() !== hours ||
    selectedDateTime.getMinutes() !== minutes
  ) {
    return null;
  }

  return selectedDateTime;
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
