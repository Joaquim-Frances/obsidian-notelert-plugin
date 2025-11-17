import { App, Notice } from "obsidian";
import { DetectedPattern, NotelertSettings } from "../../core/types";
import { getTranslation } from "../../i18n";

export function generateDeepLink(pattern: DetectedPattern, app: App): string {
  const title = encodeURIComponent(pattern.title);
  
  // Limpiar el mensaje de los patrones :@fecha, hora y :#ubicacion
  let cleanMessage = pattern.message;
  // Eliminar patrones :@fecha, hora (ej: :@2024-01-15, 14:30)
  cleanMessage = cleanMessage.replace(/:@[^,\s]+,\s*[^\s]+/g, '');
  // Eliminar patrones :#ubicacion (ej: :#Supermercado)
  cleanMessage = cleanMessage.replace(/:#[^\s]+/g, '');
  // Limpiar espacios extra
  cleanMessage = cleanMessage.trim().replace(/\s+/g, ' ');
  
  const message = encodeURIComponent(cleanMessage);
  const date = pattern.date;
  const time = pattern.time;
  const type = pattern.type || (pattern.location ? 'location' : 'time'); // Tipo: 'time' o 'location'
  
  // Parámetros de ubicación si están disponibles
  let locationParams = '';
  if (pattern.location) {
    locationParams = `&location=${encodeURIComponent(pattern.location)}`;
    if (pattern.latitude !== undefined && pattern.longitude !== undefined) {
      locationParams += `&latitude=${pattern.latitude}&longitude=${pattern.longitude}`;
    }
    if (pattern.radius !== undefined) {
      locationParams += `&radius=${pattern.radius}`;
    }
  }
  
  // Crear deep link de vuelta a Obsidian si tenemos información del archivo
  let returnLink = '';
  if (pattern.filePath && pattern.lineNumber) {
    const obsidianLink = `obsidian://open?vault=${encodeURIComponent(app.vault.getName())}&file=${encodeURIComponent(pattern.filePath)}&line=${pattern.lineNumber}`;
    returnLink = `&returnLink=${encodeURIComponent(obsidianLink)}`;
  }
  
  return `notelert://add?title=${title}&message=${message}&date=${date}&time=${time}&type=${type}${locationParams}${returnLink}`;
}

export async function createNotification(
  pattern: DetectedPattern,
  app: App,
  settings: NotelertSettings,
  log: (message: string) => void
): Promise<void> {
  try {
    const deeplink = generateDeepLink(pattern, app);
    log(`Ejecutando deeplink: ${deeplink}`);
    
    // Método simplificado para abrir el deeplink sin causar problemas de guardado
    // Usar location.href directamente es más simple y menos propenso a causar conflictos
    if (typeof window !== 'undefined') {
      window.location.href = deeplink;
    }
  } catch (error) {
    log(`Error ejecutando deeplink: ${error}`);
    new Notice(getTranslation(settings.language, "notices.errorCreatingNotification", { title: pattern.title }));
  }
}

