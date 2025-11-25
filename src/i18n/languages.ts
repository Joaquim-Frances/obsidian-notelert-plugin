// Idiomas soportados por el plugin

import { Language } from './types';

export const SUPPORTED_LANGUAGES: Language[] = [
  {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    keywords: ['Recordar:', 'Notificar:', 'Alerta:', 'Recordatorio:', 'Aviso:', 'Reminder:', 'Notify:', 'Alert:'],
    datePatterns: {
      today: ['hoy'],
      tomorrow: ['mañana'],
      yesterday: ['ayer']
    },
    timePatterns: {
      format24h: ['HH:MM', 'H:MM'],
      format12h: ['HH:MM AM/PM', 'H:MM AM/PM']
    }
  },
  {
    code: 'ca',
    name: 'Catalan',
    nativeName: 'Català',
    keywords: ['Recordar:', 'Notificar:', 'Alerta:', 'Recordatori:', 'Avís:', 'Reminder:', 'Notify:', 'Alert:'],
    datePatterns: {
      today: ['avui'],
      tomorrow: ['demà'],
      yesterday: ['ahir']
    },
    timePatterns: {
      format24h: ['HH:MM', 'H:MM'],
      format12h: ['HH:MM AM/PM', 'H:MM AM/PM']
    }
  },
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    keywords: ['Remember:', 'Notify:', 'Alert:', 'Reminder:', 'Notice:', 'Remind:', 'Alert:', 'Warning:'],
    datePatterns: {
      today: ['today'],
      tomorrow: ['tomorrow'],
      yesterday: ['yesterday']
    },
    timePatterns: {
      format24h: ['HH:MM', 'H:MM'],
      format12h: ['HH:MM AM/PM', 'H:MM AM/PM']
    }
  },
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    keywords: ['Rappeler:', 'Notifier:', 'Alerte:', 'Rappel:', 'Avis:', 'Reminder:', 'Notify:', 'Alert:'],
    datePatterns: {
      today: ['aujourd\'hui', 'aujourd hui'],
      tomorrow: ['demain'],
      yesterday: ['hier']
    },
    timePatterns: {
      format24h: ['HH:MM', 'H:MM'],
      format12h: ['HH:MM AM/PM', 'H:MM AM/PM']
    }
  },
  {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    keywords: ['Erinnern:', 'Benachrichtigen:', 'Alarm:', 'Erinnerung:', 'Hinweis:', 'Reminder:', 'Notify:', 'Alert:'],
    datePatterns: {
      today: ['heute'],
      tomorrow: ['morgen'],
      yesterday: ['gestern']
    },
    timePatterns: {
      format24h: ['HH:MM', 'H:MM'],
      format12h: ['HH:MM AM/PM', 'H:MM AM/PM']
    }
  },
  {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    keywords: ['Lembrar:', 'Notificar:', 'Alerta:', 'Lembrete:', 'Aviso:', 'Reminder:', 'Notify:', 'Alert:'],
    datePatterns: {
      today: ['hoje'],
      tomorrow: ['amanhã', 'amanha'],
      yesterday: ['ontem']
    },
    timePatterns: {
      format24h: ['HH:MM', 'H:MM'],
      format12h: ['HH:MM AM/PM', 'H:MM AM/PM']
    }
  }
];


