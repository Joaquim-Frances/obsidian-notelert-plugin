import { App, Notice, Platform } from "obsidian";
import { DetectedPattern, NotelertSettings, ScheduledEmail } from "../../core/types";
import { getTranslation } from "../../i18n";
import { scheduleEmailReminder, generateNotificationId } from "./firebase-api";
import { DEFAULT_NOTELERT_API_KEY } from "../../core/config";

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
  log: (message: string) => void,
  onEmailScheduled?: (email: ScheduledEmail) => void // Callback para guardar el email programado
): Promise<void> {
  try {
    const isDesktop = !Platform.isMobile;
    
    if (isDesktop) {
      // Desktop: Usar Firebase API para programar email
      // Usar API key de settings o la por defecto
      const apiKey = settings.notelertApiKey || DEFAULT_NOTELERT_API_KEY;
      
      if (!settings.userEmail) {
        new Notice(getTranslation(settings.language, "notices.desktopConfigRequired") || 
          "❌ Configura tu email en Settings para usar Notelert en desktop");
        return;
      }

      if (!apiKey) {
        new Notice("❌ API Key no configurada. Contacta al desarrollador del plugin.");
        return;
      }

      // Validar que no sea una notificación de ubicación (solo tiempo en desktop)
      if (pattern.type === 'location') {
        new Notice(getTranslation(settings.language, "notices.locationNotSupportedDesktop") || 
          "❌ Las notificaciones de ubicación solo están disponibles en móvil");
        return;
      }

      // Convertir fecha y hora a Date
      const scheduledDate = new Date(`${pattern.date}T${pattern.time}:00`);
      
      // Generar ID único
      const notificationId = generateNotificationId();
      
      log(`Programando email para desktop: ${pattern.title} - ${scheduledDate.toISOString()}`);
      
      // Programar email
      const result = await scheduleEmailReminder(
        settings.userEmail,
        pattern.title,
        pattern.message,
        scheduledDate,
        notificationId,
        apiKey
      );

      if (result.success && result.notificationId) {
        // Guardar el email programado en settings
        const scheduledEmail: ScheduledEmail = {
          notificationId: result.notificationId,
          title: pattern.title,
          message: pattern.message,
          scheduledDate: scheduledDate.toISOString(),
          createdAt: new Date().toISOString()
        };

        // Llamar callback si existe
        if (onEmailScheduled) {
          onEmailScheduled(scheduledEmail);
        }

        new Notice(getTranslation(settings.language, "notices.emailScheduled") || 
          "✅ Email programado correctamente");
        log(`Email programado: ${result.notificationId}`);
      } else {
        new Notice(`❌ ${result.error || 'Error al programar email'}`);
        log(`Error programando email: ${result.error}`);
      }
    } else {
      // Móvil: Usar deep link como antes
      const deeplink = generateDeepLink(pattern, app);
      log(`Ejecutando deeplink: ${deeplink}`);
      
      // Método simplificado para abrir el deeplink sin causar problemas de guardado
      if (typeof window !== 'undefined') {
        window.location.href = deeplink;
      }
    }
  } catch (error) {
    log(`Error creando notificación: ${error}`);
    new Notice(getTranslation(settings.language, "notices.errorCreatingNotification", { title: pattern.title }));
  }
}

