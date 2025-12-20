import { App, Notice, Platform } from "obsidian";
import { DetectedPattern, NotelertSettings, ScheduledEmail } from "../../core/types";
import { getTranslation } from "../../i18n";
import { scheduleEmailReminderProxy, schedulePushNotification, generateNotificationId } from "./firebase-api";
import { isIOS, getMobilePlatform, errorToString } from "./utils";

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
          "Token del plugin requerido\n\n" +
          "Para usar emails premium desde el plugin, necesitas:\n" +
          "1. Tener plan Premium activo\n" +
          "2. Generar tu token en la app móvil (Settings > Token del Plugin)\n" +
          "3. Pegar el token en Settings > Notelert > Plugin Token"
        );
        return;
      }

      if (!settings.userEmail) {
        new Notice(getTranslation(settings.language, "notices.desktopConfigRequired") || 
          "Configura tu email en Settings para usar Notelert en desktop");
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
      
      // Generar deep link de Obsidian para incluir en la push notification
      const activeFile = app.workspace.getActiveFile();
      let obsidianDeepLink: string | undefined;
      if (activeFile && pattern.filePath && pattern.lineNumber) {
        const vaultName = app.vault.getName();
        obsidianDeepLink = `obsidian://open?vault=${encodeURIComponent(vaultName)}&file=${encodeURIComponent(pattern.filePath)}&line=${pattern.lineNumber}`;
      }
      
      // Determinar el tipo de notificación
      const notificationType = pattern.type || (pattern.location ? 'location' : 'time');
      
      // Validar y preparar datos según el tipo
      let scheduledDate: Date | undefined;
      if (notificationType === 'time') {
        // Convertir fecha y hora a Date
        const dateTimeString = `${pattern.date}T${pattern.time}:00`;
        scheduledDate = new Date(dateTimeString);
        
        // Validar que la fecha sea válida
        if (isNaN(scheduledDate.getTime())) {
          new Notice(`Fecha inválida: ${dateTimeString}`);
          log(`Error: fecha inválida - ${dateTimeString}`);
          return;
        }
      }
      
      log(`Programando notificación push para desktop`);
      log(`  - Tipo: ${notificationType}`);
      log(`  - Título: ${pattern.title}`);
      log(`  - Mensaje: ${cleanMessage}`);
      if (notificationType === 'time' && scheduledDate) {
        log(`  - Fecha: ${scheduledDate.toISOString()}`);
      } else if (notificationType === 'location') {
        log(`  - Ubicación: ${pattern.location} (${pattern.latitude}, ${pattern.longitude})`);
      }
      log(`  - Notification ID: ${notificationId}`);
      
      // Mostrar feedback visual inmediato
      const loadingNotice = new Notice("Programando notificación...", 0); // 0 = no auto-close

      // Programar push notification (funciona para tiempo y ubicación)
      const pushResult = await schedulePushNotification(
        {
          ...pattern,
          message: cleanMessage, // Usar mensaje limpio
        },
        notificationId,
        settings.pluginToken,
        obsidianDeepLink
      );
      
      // Cerrar el notice de carga
      loadingNotice.hide();

      if (!pushResult.success) {
        // Error al programar push notification
        const errorMessage = pushResult.error || 'Error al programar notificación push';
        new Notice(errorMessage);
        log(`Error programando push notification: ${errorMessage}`);
        throw new Error(errorMessage);
      }

      // Si es notificación de tiempo y tenemos email configurado, también programar email
      if (notificationType === 'time' && settings.userEmail && scheduledDate) {
        log(`También programando email para notificación de tiempo`);
        
        const emailResult = await scheduleEmailReminderProxy(
          settings.userEmail,
          pattern.title,
          cleanMessage,
          scheduledDate,
          notificationId, // Mismo ID para mantener consistencia
          settings.pluginToken
        );
        
        if (emailResult.success && emailResult.notificationId) {
          // Guardar el email programado en settings
          const scheduledEmail: ScheduledEmail = {
            notificationId: emailResult.notificationId,
            title: pattern.title,
            message: cleanMessage,
            scheduledDate: scheduledDate.toISOString(),
            createdAt: new Date().toISOString()
          };

          // Llamar callback si existe
          if (onEmailScheduled) {
            onEmailScheduled(scheduledEmail);
          }

          log(`Email también programado: ${emailResult.notificationId}`);
        } else {
          // No fallar si el email falla, solo loggear
          log(`Advertencia: Push notification programada pero email falló: ${emailResult.error || 'Error desconocido'}`);
          // Mostrar el error al usuario si es crítico
          if (emailResult.error && emailResult.error.includes('Token')) {
            new Notice(`⚠️ ${emailResult.error}`);
          }
        }
      }

      // Mostrar mensaje de éxito
      const successMessage = notificationType === 'location' 
        ? (getTranslation(settings.language, "notices.pushNotificationScheduled") || "Notificación de ubicación programada correctamente")
        : (getTranslation(settings.language, "notices.pushNotificationScheduled") || "Notificación programada correctamente");
      
      new Notice(successMessage);
      log(`Push notification programada: ${pushResult.notificationId}`);
    } else if (!pushResult.success && pushResult.error) {
      // Mostrar error específico del backend
      const errorMessage = pushResult.error;
      log(`Error al programar notificación: ${errorMessage}`);
      new Notice(`❌ ${errorMessage}`);
      throw new Error(errorMessage);
    } else {
      // Móvil: Detectar plataforma y validar
      const mobilePlatform = getMobilePlatform();
      log(`Plataforma móvil detectada: ${mobilePlatform}`);
      
      // Verificar si es iOS
      if (isIOS()) {
        new Notice(
          getTranslation(settings.language, "notices.iosNotSupported") || 
          "iOS detectado\n\n" +
          "Notelert actualmente solo está disponible para Android.\n" +
          "La app de iOS está en desarrollo. Por favor, usa un dispositivo Android para crear notificaciones."
        );
        log(`iOS detectado - Notelert no está disponible para iOS aún`);
        return;
      }
      
      // Móvil (Android): Usar deep link como antes
      const deeplink = generateDeepLink(pattern, app);
      log(`Ejecutando deeplink en ${mobilePlatform}: ${deeplink}`);
      
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
    log(`Error creando notificación: ${errorToString(error)}`);
    new Notice(getTranslation(settings.language, "notices.errorCreatingNotification", { title: pattern.title }));
    // Re-lanzar para que el modal no se cierre
    throw error;
  }
}

