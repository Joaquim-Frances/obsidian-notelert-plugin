import { DetectedPattern } from "../../core/types";

// Crear identificador único para una notificación
export function createNotificationId(pattern: DetectedPattern): string {
  // Usar título, fecha, hora y contenido del mensaje para crear un ID único
  // No usar posición porque puede cambiar al editar el texto
  const contentHash = simpleHash(pattern.message);
  return `${pattern.title}|${pattern.date}|${pattern.time}|${contentHash}`;
}

// Función simple para crear hash del contenido
export function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convertir a 32bit integer
  }
  return Math.abs(hash).toString(36);
}

// Verificar si una línea ya tiene un icono visual
export function hasVisualIndicator(line: string): boolean {
  // Lista de iconos comunes que podrían indicar que ya fue procesado
  const visualIndicators = [
    "⏰", "🕐", "🕑", "🕒", "🕓", "🕔", "🕕", "🕖", "🕗", "🕘", "🕙", "🕚", "🕛",
    "📅", "📆", "🗓️", "⏱️", "⏲️", "⏳", "⌚", "🔔", "✅", "✓", "✔️", "🎯"
  ];
  
  return visualIndicators.some(icon => line.includes(icon));
}

