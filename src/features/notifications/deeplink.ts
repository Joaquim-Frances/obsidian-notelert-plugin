import { App, Notice, Platform } from "obsidian";
import { DetectedPattern, NotelertSettings, ScheduledEmail } from "../../core/types";
import { getTranslation } from "../../i18n";
import { scheduleEmailReminderProxy, generateNotificationId } from "./firebase-api";
import { PLUGIN_SCHEDULE_EMAIL_URL } from "../../core/config";

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
      // Desktop: Usar Firebase API para programar email (requiere token premium)
      
      // Validar token del plugin PRIMERO (requerido para premium features)
      if (!settings.pluginToken || settings.pluginToken.trim() === '') {
        new Notice(
          "🔑 Token del plugin requerido\n\n" +
          "Para usar emails premium desde el plugin, necesitas:\n" +
          "1. Tener plan Premium activo\n" +
          "2. Generar tu token en la app móvil (Settings > Token del Plugin)\n" +
          "3. Pegar el token en Settings > Notelert > Plugin Token"
        );
        return;
      }

      if (!settings.userEmail) {
        new Notice(getTranslation(settings.language, "notices.desktopConfigRequired") || 
          "❌ Configura tu email en Settings para usar Notelert en desktop");
        return;
      }

      // Validar que no sea una notificación de ubicación (solo tiempo en desktop)
      if (pattern.type === 'location') {
        new Notice(getTranslation(settings.language, "notices.locationNotSupportedDesktop") || 
          "❌ Las notificaciones de ubicación solo están disponibles en móvil");
        return;
      }

      // Convertir fecha y hora a Date
      // Usar formato ISO para evitar problemas de zona horaria
      const dateTimeString = `${pattern.date}T${pattern.time}:00`;
      const scheduledDate = new Date(dateTimeString);
      
      // Validar que la fecha sea válida
      if (isNaN(scheduledDate.getTime())) {
        new Notice(`❌ Fecha inválida: ${dateTimeString}`);
        log(`Error: Fecha inválida - ${dateTimeString}`);
        return;
      }
      
      // Limpiar el mensaje de los patrones :@fecha, hora y :#ubicacion (igual que en móvil)
      let cleanMessage = pattern.message;
      // Eliminar patrones :@fecha, hora (ej: :@2024-01-15, 14:30)
      cleanMessage = cleanMessage.replace(/:@[^,\s]+,\s*[^\s]+/g, '');
      // Eliminar patrones :#ubicacion (ej: :#Supermercado)
      cleanMessage = cleanMessage.replace(/:#[^\s]+/g, '');
      // Limpiar espacios extra
      cleanMessage = cleanMessage.trim().replace(/\s+/g, ' ');
      
      // Generar ID único
      const notificationId = generateNotificationId();
      
      log(`Programando email para desktop:`);
      log(`  - Título: ${pattern.title}`);
      log(`  - Mensaje: ${cleanMessage}`);
      log(`  - Email: ${settings.userEmail}`);
      log(`  - Fecha: ${scheduledDate.toISOString()}`);
      log(`  - Notification ID: ${notificationId}`);
      
      // Mostrar feedback visual inmediato
      const loadingNotice = new Notice("⏳ Programando email...", 0); // 0 = no auto-close

      // Programar email (token ya validado arriba)
      const result = await scheduleEmailReminderProxy(
        settings.userEmail,
        pattern.title,
        cleanMessage, // Usar mensaje limpio
        scheduledDate,
        notificationId,
        settings.pluginToken
      );
      
      // Cerrar el notice de carga
      loadingNotice.hide();

      if (result.success && result.notificationId) {
        // Guardar el email programado en settings
        const scheduledEmail: ScheduledEmail = {
          notificationId: result.notificationId,
          title: pattern.title,
          message: cleanMessage, // Usar mensaje limpio
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
        // Lanzar error para que el modal no se cierre
        const errorMessage = result.error || 'Error al programar email';
        new Notice(`❌ ${errorMessage}`);
        log(`Error programando email: ${errorMessage}`);
        throw new Error(errorMessage);
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
  } catch (error: unknown) {
    // Solo loggear errores inesperados, los errores de negocio ya se mostraron
    if (error instanceof Error && error.message.includes('Error al programar email')) {
      // Re-lanzar errores de negocio para que el modal no se cierre
      throw error;
    }
    log(`Error creando notificación: ${error instanceof Error ? error.message : String(error)}`);
    new Notice(getTranslation(settings.language, "notices.errorCreatingNotification", { title: pattern.title }));
    // Re-lanzar para que el modal no se cierre
    throw error;
  }
}

