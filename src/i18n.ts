// Sistema de internacionalización para el plugin Notelert

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  keywords: string[];
  datePatterns: {
    today: string[];
    tomorrow: string[];
    yesterday: string[];
  };
  timePatterns: {
    format24h: string[];
    format12h: string[];
  };
}

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
    code: 'it',
    name: 'Italian',
    nativeName: 'Italiano',
    keywords: ['Ricordare:', 'Notificare:', 'Allerta:', 'Promemoria:', 'Avviso:', 'Reminder:', 'Notify:', 'Alert:'],
    datePatterns: {
      today: ['oggi'],
      tomorrow: ['domani'],
      yesterday: ['ieri']
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
  },
  {
    code: 'ru',
    name: 'Russian',
    nativeName: 'Русский',
    keywords: ['Напомнить:', 'Уведомить:', 'Тревога:', 'Напоминание:', 'Уведомление:', 'Reminder:', 'Notify:', 'Alert:'],
    datePatterns: {
      today: ['сегодня'],
      tomorrow: ['завтра'],
      yesterday: ['вчера']
    },
    timePatterns: {
      format24h: ['HH:MM', 'H:MM'],
      format12h: ['HH:MM AM/PM', 'H:MM AM/PM']
    }
  },
  {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    keywords: ['覚えて:', '通知:', 'アラート:', 'リマインダー:', 'お知らせ:', 'Reminder:', 'Notify:', 'Alert:'],
    datePatterns: {
      today: ['今日', 'きょう'],
      tomorrow: ['明日', 'あした'],
      yesterday: ['昨日', 'きのう']
    },
    timePatterns: {
      format24h: ['HH:MM', 'H:MM'],
      format12h: ['HH:MM AM/PM', 'H:MM AM/PM']
    }
  },
  {
    code: 'zh',
    name: 'Chinese',
    nativeName: '中文',
    keywords: ['记住:', '通知:', '警报:', '提醒:', '注意:', 'Reminder:', 'Notify:', 'Alert:'],
    datePatterns: {
      today: ['今天'],
      tomorrow: ['明天'],
      yesterday: ['昨天']
    },
    timePatterns: {
      format24h: ['HH:MM', 'H:MM'],
      format12h: ['HH:MM AM/PM', 'H:MM AM/PM']
    }
  },
  {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    keywords: ['تذكر:', 'إشعار:', 'تنبيه:', 'تذكير:', 'تنبيه:', 'Reminder:', 'Notify:', 'Alert:'],
    datePatterns: {
      today: ['اليوم'],
      tomorrow: ['غداً', 'غدا'],
      yesterday: ['أمس']
    },
    timePatterns: {
      format24h: ['HH:MM', 'H:MM'],
      format12h: ['HH:MM AM/PM', 'H:MM AM/PM']
    }
  }
];

export const TRANSLATIONS = {
  es: {
    settings: {
      title: 'Configuración de Notelert',
      autoProcess: 'Procesamiento automático',
      autoProcessDesc: 'Activar el procesamiento automático de patrones',
      processOnSave: 'Procesar al guardar',
      processOnSaveDesc: 'Procesar automáticamente cuando se guarda una nota',
      processOnOpen: 'Procesar al abrir',
      processOnOpenDesc: 'Procesar automáticamente cuando se abre una nota',
      debugMode: 'Modo debug',
      debugModeDesc: 'Mostrar mensajes de debug en la consola',
      language: 'Idioma',
      languageDesc: 'Seleccionar idioma para detección de patrones',
      excludedFolders: 'Carpetas excluidas',
      excludedFoldersDesc: 'Carpetas que no se procesarán (separadas por comas)',
      customPatterns: 'Palabras clave personalizadas',
      customPatternsDesc: 'Palabras que activan el procesamiento (separadas por comas)',
      useDebounce: 'Usar retraso inteligente',
      useDebounceDesc: 'Esperar a que termines de escribir antes de procesar (evita notificaciones duplicadas)',
      debounceDelay: 'Tiempo de espera (segundos)',
      debounceDelayDesc: 'Tiempo a esperar después del último cambio antes de procesar',
      showConfirmationModal: 'Mostrar modal de confirmación',
      showConfirmationModalDesc: 'Preguntar antes de crear cada notificación',
      supportedPatterns: 'Patrones Soportados',
      keywords: 'Palabras clave',
      dates: 'Fechas:',
      times: 'Horas:',
      examples: 'Ejemplos:'
    },
    commands: {
      processCurrentNote: 'Procesar nota actual para Notelert',
      processAllNotes: 'Procesar todas las notas para Notelert',
      clearProcessedHistory: 'Limpiar historial de procesamiento'
    },
    notices: {
      noActiveNote: 'No hay ninguna nota abierta para procesar',
      processedNotes: 'Procesadas {count} notas para Notelert',
      processedNote: 'Procesada: {filename} ({count} notificaciones)',
      clearedHistory: 'Historial de procesamiento limpiado',
      errorCreatingNotification: 'Error creando notificación: {title}',
      defaultTitle: 'Recordatorio'
    },
    modal: {
      title: '¿Crear notificación en Notelert?',
      titleLabel: 'Título:',
      dateLabel: 'Fecha:',
      timeLabel: 'Hora:',
      messageLabel: 'Mensaje:',
      confirmButton: 'Sí, crear notificación',
      cancelButton: 'Cancelar'
    }
  },
  en: {
    settings: {
      title: 'Notelert Settings',
      autoProcess: 'Automatic processing',
      autoProcessDesc: 'Enable automatic pattern processing',
      processOnSave: 'Process on save',
      processOnSaveDesc: 'Automatically process when saving a note',
      processOnOpen: 'Process on open',
      processOnOpenDesc: 'Automatically process when opening a note',
      debugMode: 'Debug mode',
      debugModeDesc: 'Show debug messages in console',
      language: 'Language',
      languageDesc: 'Select language for pattern detection',
      excludedFolders: 'Excluded folders',
      excludedFoldersDesc: 'Folders that will not be processed (comma separated)',
      customPatterns: 'Custom keywords',
      customPatternsDesc: 'Words that trigger processing (comma separated)',
      useDebounce: 'Use smart delay',
      useDebounceDesc: 'Wait for you to finish typing before processing (prevents duplicate notifications)',
      debounceDelay: 'Wait time (seconds)',
      debounceDelayDesc: 'Time to wait after last change before processing',
      showConfirmationModal: 'Show confirmation modal',
      showConfirmationModalDesc: 'Ask before creating each notification',
      supportedPatterns: 'Supported Patterns',
      keywords: 'Keywords',
      dates: 'Dates:',
      times: 'Times:',
      examples: 'Examples:'
    },
    commands: {
      processCurrentNote: 'Process current note for Notelert',
      processAllNotes: 'Process all notes for Notelert',
      clearProcessedHistory: 'Clear processing history'
    },
    notices: {
      noActiveNote: 'No active note to process',
      processedNotes: 'Processed {count} notes for Notelert',
      processedNote: 'Processed: {filename} ({count} notifications)',
      clearedHistory: 'Processing history cleared',
      errorCreatingNotification: 'Error creating notification: {title}',
      defaultTitle: 'Reminder'
    },
    modal: {
      title: 'Create notification in Notelert?',
      titleLabel: 'Title:',
      dateLabel: 'Date:',
      timeLabel: 'Time:',
      messageLabel: 'Message:',
      confirmButton: 'Yes, create notification',
      cancelButton: 'Cancel'
    }
  },
  fr: {
    settings: {
      title: 'Paramètres Notelert',
      autoProcess: 'Traitement automatique',
      autoProcessDesc: 'Activer le traitement automatique des motifs',
      processOnSave: 'Traiter à la sauvegarde',
      processOnSaveDesc: 'Traiter automatiquement lors de la sauvegarde d\'une note',
      processOnOpen: 'Traiter à l\'ouverture',
      processOnOpenDesc: 'Traiter automatiquement lors de l\'ouverture d\'une note',
      debugMode: 'Mode debug',
      debugModeDesc: 'Afficher les messages de debug dans la console',
      language: 'Langue',
      languageDesc: 'Sélectionner la langue pour la détection de motifs',
      excludedFolders: 'Dossiers exclus',
      excludedFoldersDesc: 'Dossiers qui ne seront pas traités (séparés par des virgules)',
      customPatterns: 'Mots-clés personnalisés',
      customPatternsDesc: 'Mots qui déclenchent le traitement (séparés par des virgules)',
      supportedPatterns: 'Motifs Supportés',
      keywords: 'Mots-clés',
      dates: 'Dates:',
      times: 'Heures:',
      examples: 'Exemples:'
    },
    commands: {
      processCurrentNote: 'Traiter la note actuelle pour Notelert',
      processAllNotes: 'Traiter toutes les notes pour Notelert',
      clearProcessedHistory: 'Effacer l\'historique de traitement'
    },
    notices: {
      noActiveNote: 'Aucune note active à traiter',
      processedNotes: 'Traitées {count} notes pour Notelert',
      processedNote: 'Traité: {filename} ({count} notifications)',
      clearedHistory: 'Historique de traitement effacé',
      errorCreatingNotification: 'Erreur lors de la création de la notification: {title}',
      defaultTitle: 'Rappel'
    }
  },
  de: {
    settings: {
      title: 'Notelert Einstellungen',
      autoProcess: 'Automatische Verarbeitung',
      autoProcessDesc: 'Automatische Musterverarbeitung aktivieren',
      processOnSave: 'Beim Speichern verarbeiten',
      processOnSaveDesc: 'Automatisch verarbeiten beim Speichern einer Notiz',
      processOnOpen: 'Beim Öffnen verarbeiten',
      processOnOpenDesc: 'Automatisch verarbeiten beim Öffnen einer Notiz',
      debugMode: 'Debug-Modus',
      debugModeDesc: 'Debug-Nachrichten in der Konsole anzeigen',
      language: 'Sprache',
      languageDesc: 'Sprache für Mustererkennung auswählen',
      excludedFolders: 'Ausgeschlossene Ordner',
      excludedFoldersDesc: 'Ordner, die nicht verarbeitet werden (durch Kommas getrennt)',
      customPatterns: 'Benutzerdefinierte Schlüsselwörter',
      customPatternsDesc: 'Wörter, die die Verarbeitung auslösen (durch Kommas getrennt)',
      supportedPatterns: 'Unterstützte Muster',
      keywords: 'Schlüsselwörter',
      dates: 'Daten:',
      times: 'Zeiten:',
      examples: 'Beispiele:'
    },
    commands: {
      processCurrentNote: 'Aktuelle Notiz für Notelert verarbeiten',
      processAllNotes: 'Alle Notizen für Notelert verarbeiten',
      clearProcessedHistory: 'Verarbeitungshistorie löschen'
    },
    notices: {
      noActiveNote: 'Keine aktive Notiz zum Verarbeiten',
      processedNotes: 'Verarbeitet {count} Notizen für Notelert',
      processedNote: 'Verarbeitet: {filename} ({count} Benachrichtigungen)',
      clearedHistory: 'Verarbeitungshistorie gelöscht',
      errorCreatingNotification: 'Fehler beim Erstellen der Benachrichtigung: {title}',
      defaultTitle: 'Erinnerung'
    }
  },
  it: {
    settings: {
      title: 'Impostazioni Notelert',
      autoProcess: 'Elaborazione automatica',
      autoProcessDesc: 'Abilita l\'elaborazione automatica dei pattern',
      processOnSave: 'Elabora al salvare',
      processOnSaveDesc: 'Elabora automaticamente quando si salva una nota',
      processOnOpen: 'Elabora all\'apertura',
      processOnOpenDesc: 'Elabora automaticamente quando si apre una nota',
      debugMode: 'Modalità debug',
      debugModeDesc: 'Mostra i messaggi di debug nella console',
      language: 'Lingua',
      languageDesc: 'Seleziona la lingua per il rilevamento dei pattern',
      excludedFolders: 'Cartelle escluse',
      excludedFoldersDesc: 'Cartelle che non verranno elaborate (separate da virgole)',
      customPatterns: 'Parole chiave personalizzate',
      customPatternsDesc: 'Parole che attivano l\'elaborazione (separate da virgole)',
      supportedPatterns: 'Pattern Supportati',
      keywords: 'Parole chiave',
      dates: 'Date:',
      times: 'Orari:',
      examples: 'Esempi:'
    },
    commands: {
      processCurrentNote: 'Elabora nota corrente per Notelert',
      processAllNotes: 'Elabora tutte le note per Notelert',
      clearProcessedHistory: 'Cancella cronologia elaborazione'
    },
    notices: {
      noActiveNote: 'Nessuna nota attiva da elaborare',
      processedNotes: 'Elaborate {count} note per Notelert',
      processedNote: 'Elaborata: {filename} ({count} notifiche)',
      clearedHistory: 'Cronologia elaborazione cancellata',
      errorCreatingNotification: 'Errore nella creazione della notifica: {title}',
      defaultTitle: 'Promemoria'
    }
  },
  pt: {
    settings: {
      title: 'Configurações Notelert',
      autoProcess: 'Processamento automático',
      autoProcessDesc: 'Ativar processamento automático de padrões',
      processOnSave: 'Processar ao salvar',
      processOnSaveDesc: 'Processar automaticamente ao salvar uma nota',
      processOnOpen: 'Processar ao abrir',
      processOnOpenDesc: 'Processar automaticamente ao abrir uma nota',
      debugMode: 'Modo debug',
      debugModeDesc: 'Mostrar mensagens de debug no console',
      language: 'Idioma',
      languageDesc: 'Selecionar idioma para detecção de padrões',
      excludedFolders: 'Pastas excluídas',
      excludedFoldersDesc: 'Pastas que não serão processadas (separadas por vírgulas)',
      customPatterns: 'Palavras-chave personalizadas',
      customPatternsDesc: 'Palavras que ativam o processamento (separadas por vírgulas)',
      supportedPatterns: 'Padrões Suportados',
      keywords: 'Palavras-chave',
      dates: 'Datas:',
      times: 'Horários:',
      examples: 'Exemplos:'
    },
    commands: {
      processCurrentNote: 'Processar nota atual para Notelert',
      processAllNotes: 'Processar todas as notas para Notelert',
      clearProcessedHistory: 'Limpar histórico de processamento'
    },
    notices: {
      noActiveNote: 'Nenhuma nota ativa para processar',
      processedNotes: 'Processadas {count} notas para Notelert',
      processedNote: 'Processada: {filename} ({count} notificações)',
      clearedHistory: 'Histórico de processamento limpo',
      errorCreatingNotification: 'Erro ao criar notificação: {title}',
      defaultTitle: 'Lembrete'
    }
  },
  ru: {
    settings: {
      title: 'Настройки Notelert',
      autoProcess: 'Автоматическая обработка',
      autoProcessDesc: 'Включить автоматическую обработку шаблонов',
      processOnSave: 'Обрабатывать при сохранении',
      processOnSaveDesc: 'Автоматически обрабатывать при сохранении заметки',
      processOnOpen: 'Обрабатывать при открытии',
      processOnOpenDesc: 'Автоматически обрабатывать при открытии заметки',
      debugMode: 'Режим отладки',
      debugModeDesc: 'Показывать сообщения отладки в консоли',
      language: 'Язык',
      languageDesc: 'Выбрать язык для обнаружения шаблонов',
      excludedFolders: 'Исключенные папки',
      excludedFoldersDesc: 'Папки, которые не будут обрабатываться (разделенные запятыми)',
      customPatterns: 'Пользовательские ключевые слова',
      customPatternsDesc: 'Слова, которые запускают обработку (разделенные запятыми)',
      supportedPatterns: 'Поддерживаемые Шаблоны',
      keywords: 'Ключевые слова',
      dates: 'Даты:',
      times: 'Времена:',
      examples: 'Примеры:'
    },
    commands: {
      processCurrentNote: 'Обработать текущую заметку для Notelert',
      processAllNotes: 'Обработать все заметки для Notelert',
      clearProcessedHistory: 'Очистить историю обработки'
    },
    notices: {
      noActiveNote: 'Нет активной заметки для обработки',
      processedNotes: 'Обработано {count} заметок для Notelert',
      processedNote: 'Обработано: {filename} ({count} уведомлений)',
      clearedHistory: 'История обработки очищена',
      errorCreatingNotification: 'Ошибка создания уведомления: {title}',
      defaultTitle: 'Напоминание'
    }
  },
  ja: {
    settings: {
      title: 'Notelert設定',
      autoProcess: '自動処理',
      autoProcessDesc: 'パターンの自動処理を有効にする',
      processOnSave: '保存時に処理',
      processOnSaveDesc: 'ノートを保存する際に自動処理する',
      processOnOpen: '開く時に処理',
      processOnOpenDesc: 'ノートを開く際に自動処理する',
      debugMode: 'デバッグモード',
      debugModeDesc: 'コンソールにデバッグメッセージを表示',
      language: '言語',
      languageDesc: 'パターン検出の言語を選択',
      excludedFolders: '除外フォルダ',
      excludedFoldersDesc: '処理されないフォルダ（カンマ区切り）',
      customPatterns: 'カスタムキーワード',
      customPatternsDesc: '処理をトリガーする単語（カンマ区切り）',
      supportedPatterns: 'サポートされるパターン',
      keywords: 'キーワード',
      dates: '日付:',
      times: '時間:',
      examples: '例:'
    },
    commands: {
      processCurrentNote: '現在のノートをNotelert用に処理',
      processAllNotes: 'すべてのノートをNotelert用に処理',
      clearProcessedHistory: '処理履歴をクリア'
    },
    notices: {
      noActiveNote: '処理するアクティブなノートがありません',
      processedNotes: 'Notelert用に{count}個のノートを処理しました',
      processedNote: '処理済み: {filename} ({count}個の通知)',
      clearedHistory: '処理履歴をクリアしました',
      errorCreatingNotification: '通知の作成エラー: {title}',
      defaultTitle: 'リマインダー'
    }
  },
  zh: {
    settings: {
      title: 'Notelert设置',
      autoProcess: '自动处理',
      autoProcessDesc: '启用模式自动处理',
      processOnSave: '保存时处理',
      processOnSaveDesc: '保存笔记时自动处理',
      processOnOpen: '打开时处理',
      processOnOpenDesc: '打开笔记时自动处理',
      debugMode: '调试模式',
      debugModeDesc: '在控制台显示调试消息',
      language: '语言',
      languageDesc: '选择模式检测语言',
      excludedFolders: '排除文件夹',
      excludedFoldersDesc: '不会处理的文件夹（逗号分隔）',
      customPatterns: '自定义关键词',
      customPatternsDesc: '触发处理的单词（逗号分隔）',
      supportedPatterns: '支持的模式',
      keywords: '关键词',
      dates: '日期:',
      times: '时间:',
      examples: '示例:'
    },
    commands: {
      processCurrentNote: '处理当前笔记用于Notelert',
      processAllNotes: '处理所有笔记用于Notelert',
      clearProcessedHistory: '清除处理历史'
    },
    notices: {
      noActiveNote: '没有要处理的活跃笔记',
      processedNotes: '为Notelert处理了{count}个笔记',
      processedNote: '已处理: {filename} ({count}个通知)',
      clearedHistory: '处理历史已清除',
      errorCreatingNotification: '创建通知错误: {title}',
      defaultTitle: '提醒'
    }
  },
  ar: {
    settings: {
      title: 'إعدادات Notelert',
      autoProcess: 'المعالجة التلقائية',
      autoProcessDesc: 'تفعيل المعالجة التلقائية للأنماط',
      processOnSave: 'المعالجة عند الحفظ',
      processOnSaveDesc: 'المعالجة التلقائية عند حفظ ملاحظة',
      processOnOpen: 'المعالجة عند الفتح',
      processOnOpenDesc: 'المعالجة التلقائية عند فتح ملاحظة',
      debugMode: 'وضع التصحيح',
      debugModeDesc: 'عرض رسائل التصحيح في وحدة التحكم',
      language: 'اللغة',
      languageDesc: 'اختيار لغة اكتشاف الأنماط',
      excludedFolders: 'المجلدات المستبعدة',
      excludedFoldersDesc: 'المجلدات التي لن يتم معالجتها (مفصولة بفواصل)',
      customPatterns: 'الكلمات المفتاحية المخصصة',
      customPatternsDesc: 'الكلمات التي تبدأ المعالجة (مفصولة بفواصل)',
      supportedPatterns: 'الأنماط المدعومة',
      keywords: 'الكلمات المفتاحية',
      dates: 'التواريخ:',
      times: 'الأوقات:',
      examples: 'أمثلة:'
    },
    commands: {
      processCurrentNote: 'معالجة الملاحظة الحالية لـ Notelert',
      processAllNotes: 'معالجة جميع الملاحظات لـ Notelert',
      clearProcessedHistory: 'مسح تاريخ المعالجة'
    },
    notices: {
      noActiveNote: 'لا توجد ملاحظة نشطة للمعالجة',
      processedNotes: 'تم معالجة {count} ملاحظة لـ Notelert',
      processedNote: 'تم المعالجة: {filename} ({count} إشعار)',
      clearedHistory: 'تم مسح تاريخ المعالجة',
      errorCreatingNotification: 'خطأ في إنشاء الإشعار: {title}',
      defaultTitle: 'تذكير'
    }
  }
};

export function getTranslation(language: string, key: string, params?: Record<string, string | number>): string {
  const lang = language as keyof typeof TRANSLATIONS;
  const translation = TRANSLATIONS[lang] || TRANSLATIONS.en;
  
  const keys = key.split('.');
  let value: any = translation;
  
  for (const k of keys) {
    value = value?.[k];
  }
  
  if (typeof value !== 'string') {
    return key; // Fallback to key if translation not found
  }
  
  // Replace parameters
  if (params) {
    for (const [param, val] of Object.entries(params)) {
      value = value.replace(`{${param}}`, String(val));
    }
  }
  
  return value;
}

export function getLanguageByCode(code: string): Language | undefined {
  return SUPPORTED_LANGUAGES.find(lang => lang.code === code);
}

export function getDefaultLanguage(): Language {
  return SUPPORTED_LANGUAGES[0]; // Spanish as default
}
