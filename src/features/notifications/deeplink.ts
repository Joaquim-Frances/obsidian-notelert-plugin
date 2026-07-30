import { App, Notice, Platform } from "obsidian";
import { DetectedPattern, NotelertSettings, ScheduledEmail } from "../../core/types";
import { getTranslation } from "../../i18n";
import { scheduleEmailReminderProxy, schedulePushNotification, generateNotificationId } from "./firebase-api";
import { isIOS, errorToString } from "./utils";
import { getPremiumStatus } from "../premium/premium-service";
import { scheduleGoogleCalendarReminder } from "./google-calendar-api";
import { scheduleTelegramReminder } from "./telegram-api";

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
    // Validar App link token PRIMERO (requerido para todas las plataformas ahora)
    if (!settings.pluginToken || settings.pluginToken.trim() === '') {
      new Notice(getTranslation(settings.language, "notices.tokenRequiredFull"), 10000);
      return;
    }

    // Verificar si es iOS (solo en móvil)
    if (Platform.isMobile && isIOS()) {
      new Notice(getTranslation(settings.language, "notices.iosNotSupported"), 10000);
      return;
    }

    // Limpiar el mensaje de los patrones :@fecha, hora y :#ubicacion
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
        new Notice(getTranslation(settings.language, "notices.invalidDate", { date: dateTimeString }), 10000);
        log(`Error: fecha inválida - ${dateTimeString}`);
        return;
      }
    }

    log(`Programando notificación push (Unified Flow)`);
    log(`  - Platform: ${Platform.isMobile ? 'Mobile' : 'Desktop'}`);
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
    const loadingNotice = new Notice(getTranslation(settings.language, "notices.schedulingNotification"), 0); // 0 = no auto-close

    const hasVerifiedEmail = notificationType === 'time' &&
      settings.notificationEmailStatus === 'verified' &&
      !!settings.notificationEmail &&
      !!scheduledDate;
    const selectedChannels = settings.deliveryChannels?.length
      ? settings.deliveryChannels
      : settings.deliveryMode === 'both'
        ? ['push', 'email']
        : [settings.deliveryMode || (hasVerifiedEmail ? 'email' : 'push')];
    const wantsEmail = notificationType === 'time' && selectedChannels.includes('email');
    const wantsCalendar = notificationType === 'time' && selectedChannels.includes('calendar');
    const wantsTelegram = notificationType === 'time' && selectedChannels.includes('telegram');
    const wantsPush = notificationType === 'location' || selectedChannels.includes('push');
    // `undefined` conserva el flujo push de instalaciones antiguas hasta que
    // se sincronice la configuración. Las cuentas email-only reciben false.
    const hasPushDelivery = settings.hasActivePushDevice !== false;
    const shouldSchedulePush = wantsPush && hasPushDelivery;
    const shouldScheduleEmail = wantsEmail && hasVerifiedEmail;

    let unavailableDeliveryMessage = '';
    if (notificationType === 'location' && !selectedChannels.includes('push')) {
      unavailableDeliveryMessage = getTranslation(settings.language, "notices.locationRequiresPush");
    } else if (wantsEmail && !hasVerifiedEmail) {
      unavailableDeliveryMessage = getTranslation(settings.language, "notices.emailDeliveryUnavailable");
    } else if (wantsPush && !hasPushDelivery) {
      unavailableDeliveryMessage = getTranslation(settings.language, "notices.pushDeliveryUnavailable");
    }

    if (
      unavailableDeliveryMessage ||
      (!shouldSchedulePush && !shouldScheduleEmail && !wantsCalendar && !wantsTelegram)
    ) {
      loadingNotice.hide();
      const errorMessage = unavailableDeliveryMessage || getTranslation(settings.language, "notices.deliveryRequired");
      new Notice(errorMessage, 10000);
      const deliveryError = new Error(errorMessage);
      deliveryError.name = 'DeliveryConfigurationError';
      throw deliveryError;
    }

    let pushSucceeded = false;
    let emailSucceeded = false;
    let calendarSucceeded = false;
    let telegramSucceeded = false;
    const deliveryErrors: string[] = [];

    if (shouldSchedulePush) {
      const pushResult = await schedulePushNotification(
        { ...pattern, message: cleanMessage },
        notificationId,
        settings.pluginToken,
        obsidianDeepLink,
        settings.language
      );
      pushSucceeded = pushResult.success;
      if (!pushResult.success) {
        let deliveryError = pushResult.error || getTranslation(settings.language, "notices.pushScheduleError");
        if (pushResult.errorCode === 'TOKEN_INVALID') {
          deliveryError = getTranslation(settings.language, "notices.tokenInvalid403") || deliveryError;
        } else if (pushResult.errorCode === 'LINK_ERROR') {
          deliveryError = getTranslation(settings.language, "notices.linkError400") || deliveryError;
        } else if (pushResult.errorCode === 'PREMIUM_REQUIRED') {
          deliveryError = getTranslation(settings.language, "datePicker.premiumRequiredDesc") || deliveryError;
        }
        deliveryErrors.push(deliveryError);
        log(`Error programando push notification: ${deliveryError}`);
      } else if (pushResult.hasActiveDevices === false) {
        settings.hasActivePushDevice = false;
      }
    }

    if (shouldScheduleEmail && scheduledDate) {
      log(`Programando entrega por email verificado`);
      const emailResult = await scheduleEmailReminderProxy(
        pattern.title,
        cleanMessage,
        scheduledDate,
        notificationId,
        settings.pluginToken,
        settings.language
      );
      emailSucceeded = emailResult.success;

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

        log(`Email programado: ${emailResult.notificationId}`);
        void getPremiumStatus(settings.pluginToken, true);
      } else {
        const deliveryError = emailResult.error || getTranslation(settings.language, "notices.emailDeliveryUnavailable");
        deliveryErrors.push(deliveryError);
        log(`Error programando email: ${deliveryError}`);
      }
    }

    if (wantsCalendar && scheduledDate) {
      try {
        log(`Programando entrega en Google Calendar`);
        await scheduleGoogleCalendarReminder({
          pluginToken: settings.pluginToken,
          notificationId,
          title: pattern.title,
          message: cleanMessage,
          scheduledDate,
          obsidianDeepLink,
        });
        calendarSucceeded = true;
      } catch (error) {
        const deliveryError = errorToString(error);
        deliveryErrors.push(deliveryError);
        log(`Error programando Google Calendar: ${deliveryError}`);
      }
    }

    if (wantsTelegram && scheduledDate) {
      try {
        log(`Programando entrega en Telegram`);
        await scheduleTelegramReminder({
          pluginToken: settings.pluginToken,
          notificationId,
          title: pattern.title,
          message: cleanMessage,
          scheduledDate,
          obsidianDeepLink,
        });
        telegramSucceeded = true;
      } catch (error) {
        const deliveryError = errorToString(error);
        deliveryErrors.push(deliveryError);
        log(`Error programando Telegram: ${deliveryError}`);
      }
    }

    loadingNotice.hide();
    if (!pushSucceeded && !emailSucceeded && !calendarSucceeded && !telegramSucceeded) {
      const errorMessage = deliveryErrors[0] ||
        getTranslation(settings.language, "notices.errorCreatingNotification", { title: pattern.title });
      new Notice(errorMessage, 10000);
      throw new Error(errorMessage);
    }

    const channelResults = [
      { requested: shouldSchedulePush, succeeded: pushSucceeded, label: 'Android' },
      { requested: shouldScheduleEmail, succeeded: emailSucceeded, label: 'Email' },
      { requested: wantsCalendar, succeeded: calendarSucceeded, label: 'Google Calendar' },
      { requested: wantsTelegram, succeeded: telegramSucceeded, label: 'Telegram' },
    ];
    const successfulChannels = channelResults
      .filter(channel => channel.requested && channel.succeeded)
      .map(channel => channel.label);
    const failedChannels = channelResults
      .filter(channel => channel.requested && !channel.succeeded)
      .map(channel => channel.label);
    const partialDelivery = failedChannels.length > 0;

    if (partialDelivery) {
      new Notice(getTranslation(settings.language, "notices.deliveryPartialSummary", {
        successful: successfulChannels.join(', '),
        failed: failedChannels.join(', '),
      }), 10000);
      log(`Recordatorio programado parcialmente. Correctos: ${successfulChannels.join(', ')}. Fallidos: ${failedChannels.join(', ')}. ${deliveryErrors.join(' | ')}`);
      return;
    }

    new Notice(getTranslation(settings.language, "notices.deliveryScheduledSummary", {
      channels: successfulChannels.join(', '),
    }), 10000);
    
    log(`Recordatorio programado (push=${pushSucceeded}, email=${emailSucceeded}, calendar=${calendarSucceeded}, telegram=${telegramSucceeded})`);
  } catch (error: unknown) {
    // Solo loggear errores inesperados, los errores de negocio ya se mostraron
    if (error instanceof Error && (
      error.name === 'DeliveryConfigurationError' ||
      error.message.includes('Error al programar email') ||
      error.message.includes('Token') ||
      error.message.includes('inválido') ||
      error.message.includes('expirado')
    )) {
      // Re-lanzar errores de negocio para que el modal no se cierre
      throw error;
    }
    log(`Error creando notificación: ${errorToString(error)}`);
    new Notice(getTranslation(settings.language, "notices.errorCreatingNotification", { title: pattern.title }), 10000);
    // Re-lanzar para que el modal no se cierre
    throw error;
  }
}
