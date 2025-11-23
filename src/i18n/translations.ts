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
      addVisualIndicators: 'Añadir iconos visuales',
      addVisualIndicatorsDesc: 'Añadir iconos a los recordatorios procesados para identificarlos visualmente',
      visualIndicatorIcon: 'Icono visual',
      visualIndicatorIconDesc: 'Icono a añadir al final de los recordatorios procesados',
      useNewSyntax: 'Usar nuevo sistema',
      useNewSyntaxDesc: 'Usar el nuevo formato :@fecha, hora en lugar del sistema anterior',
      enableDatePicker: 'Activar date picker',
      enableDatePickerDesc: 'Abrir automáticamente el selector de fecha al escribir :@',
      supportedPatterns: 'Patrones Soportados',
      keywords: 'Palabras clave',
      dates: 'Fechas:',
      times: 'Horas:',
      examples: 'Ejemplos:',
      platformInfo: {
        desktopTitle: '💻 Modo Desktop',
        desktopDesc: 'En desktop, Notelert envía notificaciones por email. Las notificaciones de ubicación solo están disponibles en móvil.',
        mobileTitle: '📱 Modo Móvil',
        mobileDesc: 'En móvil, Notelert usa la app para enviar notificaciones push y emails. Puedes configurar ubicaciones favoritas para recordatorios basados en ubicación.'
      },
      basicSettings: 'Configuración Básica',
      pluginToken: {
        title: '🔑 Token del Plugin',
        descDesktop: 'Token de autenticación para usar geocodificación y emails premium. Obtén tu token desde la app móvil en Settings > Plugin Token.',
        descMobile: 'Token de autenticación para usar geocodificación premium. Obtén tu token desde la app móvil en Settings > Plugin Token.',
        placeholder: 'Pega tu token aquí...',
        showHide: 'Mostrar/Ocultar'
      },
      desktopSettings: {
        title: '💻 Configuración Desktop',
        userEmailTitle: 'Email del Usuario (Opcional)',
        userEmailDesc: 'Email donde recibirás las notificaciones. Ya no es necesario si usas token del plugin.',
        userEmailPlaceholder: 'usuario@email.com'
      },
      scheduledEmails: {
        title: '📧 Emails Programados',
        desc: 'Gestiona tus emails programados. Puedes cancelarlos antes de que se envíen.',
        empty: 'No hay emails programados. Los emails que programes aparecerán aquí.',
        cancelButton: '🗑️ Cancelar',
        canceling: 'Cancelando...',
        cancelSuccess: '✅ Email cancelado correctamente',
        cancelError: '❌ Error al cancelar email',
        past: '(Pasado)'
      },
      mobileSettings: {
        title: '📱 Configuración Móvil'
      },
      savedLocations: {
        title: '📍 Ubicaciones Guardadas',
        desc: 'Gestiona tus ubicaciones favoritas. Estas aparecerán cuando selecciones \'Ubicación\' al crear una notificación.',
        addTitle: 'Añadir Nueva Ubicación',
        addDesc: 'Abre el selector de ubicaciones con mapa para añadir una nueva ubicación',
        addButton: '➕ Añadir Ubicación',
        empty: 'No hay ubicaciones guardadas. Haz clic en \'Añadir Ubicación\' para empezar.',
        editButton: '✏️ Editar',
        deleteButton: '🗑️'
      }
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
      defaultTitle: 'Recordatorio',
      desktopConfigRequired: '❌ Configura tu email y API Key en Settings para usar Notelert en desktop',
      locationNotSupportedDesktop: '❌ Las notificaciones de ubicación solo están disponibles en móvil',
      emailScheduled: '✅ Email programado correctamente'
    },
    modal: {
      title: '¿Crear notificación en Notelert?',
      titleLabel: 'Título:',
      dateLabel: 'Fecha:',
      timeLabel: 'Hora:',
      messageLabel: 'Mensaje:',
      confirmButton: 'Sí, crear notificación',
      cancelButton: 'Cancelar'
    },
    datePicker: {
      title: 'Seleccionar fecha y hora',
      dateLabel: 'Fecha:',
      timeLabel: 'Hora:',
      quickActions: 'Acciones rápidas:',
      today: 'Hoy',
      tomorrow: 'Mañana',
      in1Hour: 'En 1 hora',
      in2Hours: 'En 2 horas',
      confirmButton: 'Confirmar notificación',
      cancelButton: 'Cancelar',
      selectDateTime: 'Por favor, selecciona una fecha y hora',
      notificationType: 'Tipo de notificación:',
      timeNotification: 'Tiempo',
      locationNotification: 'Ubicación',
      noSavedLocations: 'No hay ubicaciones guardadas. Ve a Settings para añadir ubicaciones.',
      selectSavedLocation: 'Seleccionar Ubicación Guardada',
      hours: 'Horas',
      minutes: 'Minutos',
      selectLocationTitle: 'Selecciona una ubicación:'
    },
    locationPicker: {
      title: 'Seleccionar Ubicación',
      searchPlaceholder: 'Buscar dirección o lugar...',
      radius: 'Radio (metros):',
      favorites: 'Ubicaciones Favoritas',
      cancelButton: 'Cancelar',
      confirmButton: 'Confirmar',
      noFavorites: 'No hay ubicaciones guardadas',
      selectButton: 'Seleccionar',
      deleteButton: 'Eliminar',
      saveFavorite: '⭐ Guardar',
      saved: '✓ Guardado',
      searching: 'Buscando...',
      noResults: 'No se encontraron resultados',
      error: 'Error al buscar ubicaciones',
      connectionError: 'Error de conexión. Verifica tu conexión a internet.',
      rateLimit: 'Demasiadas solicitudes. Espera un momento antes de buscar de nuevo.',
      apiKeyError: 'Error: API key no configurada o inválida. Verifica la configuración.',
      selectLocation: 'Selecciona una ubicación de los resultados o de tus favoritas',
      locationSelected: 'Ubicación seleccionada',
      loadingMap: 'Cargando mapa...',
      debugMap: '🔍 Debug Mapa',
      mapError: '⚠️ Error',
      mapErrorTitle: 'Error al cargar el mapa',
      googleMapsError: 'Google Maps no se cargó correctamente'
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
      addVisualIndicators: 'Add visual indicators',
      addVisualIndicatorsDesc: 'Add icons to processed reminders to identify them visually',
      visualIndicatorIcon: 'Visual icon',
      visualIndicatorIconDesc: 'Icon to add at the end of processed reminders',
      useNewSyntax: 'Use new system',
      useNewSyntaxDesc: 'Use the new :@date, time format instead of the previous system',
      enableDatePicker: 'Enable date picker',
      enableDatePickerDesc: 'Automatically open date selector when typing :@',
      supportedPatterns: 'Supported Patterns',
      keywords: 'Keywords',
      dates: 'Dates:',
      times: 'Times:',
      examples: 'Examples:',
      platformInfo: {
        desktopTitle: '💻 Desktop Mode',
        desktopDesc: 'On desktop, Notelert sends email notifications. Location notifications are only available on mobile.',
        mobileTitle: '📱 Mobile Mode',
        mobileDesc: 'On mobile, Notelert uses the app to send push notifications and emails. You can configure favorite locations for location-based reminders.'
      },
      basicSettings: 'Basic Settings',
      pluginToken: {
        title: '🔑 Plugin Token',
        descDesktop: 'Authentication token for premium geocoding and emails. Get your token from the mobile app in Settings > Plugin Token.',
        descMobile: 'Authentication token for premium geocoding. Get your token from the mobile app in Settings > Plugin Token.',
        placeholder: 'Paste your token here...',
        showHide: 'Show/Hide'
      },
      desktopSettings: {
        title: '💻 Desktop Settings',
        userEmailTitle: 'User Email (Optional)',
        userEmailDesc: 'Email where you will receive notifications. No longer needed if using plugin token.',
        userEmailPlaceholder: 'user@email.com'
      },
      scheduledEmails: {
        title: '📧 Scheduled Emails',
        desc: 'Manage your scheduled emails. You can cancel them before they are sent.',
        empty: 'No scheduled emails. Emails you schedule will appear here.',
        cancelButton: '🗑️ Cancel',
        canceling: 'Canceling...',
        cancelSuccess: '✅ Email canceled successfully',
        cancelError: '❌ Error canceling email',
        past: '(Past)'
      },
      mobileSettings: {
        title: '📱 Mobile Settings'
      },
      savedLocations: {
        title: '📍 Saved Locations',
        desc: 'Manage your favorite locations. These will appear when you select \'Location\' when creating a notification.',
        addTitle: 'Add New Location',
        addDesc: 'Open location picker with map to add a new location',
        addButton: '➕ Add Location',
        empty: 'No saved locations. Click \'Add Location\' to start.',
        editButton: '✏️ Edit',
        deleteButton: '🗑️'
      }
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
      defaultTitle: 'Reminder',
      desktopConfigRequired: '❌ Configure your email and API Key in Settings to use Notelert on desktop',
      locationNotSupportedDesktop: '❌ Location notifications are only available on mobile',
      emailScheduled: '✅ Email scheduled successfully'
    },
    modal: {
      title: 'Create notification in Notelert?',
      titleLabel: 'Title:',
      dateLabel: 'Date:',
      timeLabel: 'Time:',
      messageLabel: 'Message:',
      confirmButton: 'Yes, create notification',
      cancelButton: 'Cancel'
    },
    datePicker: {
      title: 'Select date and time',
      dateLabel: 'Date:',
      timeLabel: 'Time:',
      quickActions: 'Quick actions:',
      today: 'Today',
      tomorrow: 'Tomorrow',
      in1Hour: 'In 1 hour',
      in2Hours: 'In 2 hours',
      confirmButton: 'Confirm notification',
      cancelButton: 'Cancel',
      selectDateTime: 'Please select a date and time',
      notificationType: 'Notification type:',
      timeNotification: 'Time',
      locationNotification: 'Location',
      noSavedLocations: 'No saved locations. Go to Settings to add locations.',
      selectSavedLocation: 'Select Saved Location',
      hours: 'Hours',
      minutes: 'Minutes',
      selectLocationTitle: 'Select a location:'
    },
    locationPicker: {
      title: 'Select Location',
      searchPlaceholder: 'Search address or place...',
      radius: 'Radius (meters):',
      favorites: 'Favorite Locations',
      cancelButton: 'Cancel',
      confirmButton: 'Confirm',
      noFavorites: 'No saved locations',
      selectButton: 'Select',
      deleteButton: 'Delete',
      saveFavorite: '⭐ Save',
      saved: '✓ Saved',
      searching: 'Searching...',
      noResults: 'No results found',
      error: 'Error searching locations',
      connectionError: 'Connection error. Check your internet connection.',
      rateLimit: 'Too many requests. Wait a moment before searching again.',
      apiKeyError: 'Error: API key not configured or invalid. Check your settings.',
      selectLocation: 'Select a location from results or your favorites',
      locationSelected: 'Location selected',
      loadingMap: 'Loading map...',
      debugMap: '🔍 Debug Map',
      mapError: '⚠️ Error',
      mapErrorTitle: 'Error loading map',
      googleMapsError: 'Google Maps did not load correctly'
    }
  },
  ca: {
    settings: {
      title: 'Configuració de Notelert',
      autoProcess: 'Processament automàtic',
      autoProcessDesc: 'Activar el processament automàtic de patrons',
      processOnSave: 'Processar en desar',
      processOnSaveDesc: 'Processar automàticament quan es desa una nota',
      processOnOpen: 'Processar en obrir',
      processOnOpenDesc: 'Processar automàticament quan s\'obre una nota',
      debugMode: 'Mode debug',
      debugModeDesc: 'Mostrar missatges de debug a la consola',
      language: 'Idioma',
      languageDesc: 'Seleccionar idioma per a la detecció de patrons',
      excludedFolders: 'Carpetes excloses',
      excludedFoldersDesc: 'Carpetes que no es processaran (separades per comes)',
      customPatterns: 'Paraules clau personalitzades',
      customPatternsDesc: 'Paraules que activen el processament (separades per comes)',
      useDebounce: 'Usar retard intel·ligent',
      useDebounceDesc: 'Esperar que acabis d\'escriure abans de processar (evita notificacions duplicades)',
      debounceDelay: 'Temps d\'espera (segons)',
      debounceDelayDesc: 'Temps a esperar després del darrer canvi abans de processar',
      showConfirmationModal: 'Mostrar modal de confirmació',
      showConfirmationModalDesc: 'Preguntar abans de crear cada notificació',
      addVisualIndicators: 'Afegir indicadors visuals',
      addVisualIndicatorsDesc: 'Afegir icones als recordatoris processats per identificar-los visualment',
      visualIndicatorIcon: 'Icona visual',
      visualIndicatorIconDesc: 'Icona a afegir al final dels recordatoris processats',
      useNewSyntax: 'Usar nou sistema',
      useNewSyntaxDesc: 'Usar el nou format :@data, hora en lloc del sistema anterior',
      enableDatePicker: 'Activar selector de data',
      enableDatePickerDesc: 'Obrir automàticament el selector de data en escriure :@',
      supportedPatterns: 'Patrons Suportats',
      keywords: 'Paraules clau',
      dates: 'Dates:',
      times: 'Hores:',
      examples: 'Exemples:',
      platformInfo: {
        desktopTitle: '💻 Mode Escriptori',
        desktopDesc: 'A l\'escriptori, Notelert envia notificacions per correu electrònic. Les notificacions d\'ubicació només estan disponibles al mòbil.',
        mobileTitle: '📱 Mode Mòbil',
        mobileDesc: 'Al mòbil, Notelert utilitza l\'aplicació per enviar notificacions push i correus electrònics. Pots configurar ubicacions preferides per a recordatoris basats en la ubicació.'
      },
      basicSettings: 'Configuració Bàsica',
      pluginToken: {
        title: '🔑 Token del Plugin',
        descDesktop: 'Token d\'autenticació per utilitzar geocodificació i correus electrònics premium. Obteniu el vostre token des de l\'aplicació mòbil a Configuració > Token del Plugin.',
        descMobile: 'Token d\'autenticació per utilitzar geocodificació premium. Obteniu el vostre token des de l\'aplicació mòbil a Configuració > Token del Plugin.',
        placeholder: 'Enganxa el teu token aquí...',
        showHide: 'Mostra/Amaga'
      },
      desktopSettings: {
        title: '💻 Configuració d\'Escriptori',
        userEmailTitle: 'Correu electrònic de l\'usuari (Opcional)',
        userEmailDesc: 'Correu electrònic on rebràs les notificacions. Ja no és necessari si utilitzes el token del plugin.',
        userEmailPlaceholder: 'usuari@email.com'
      },
      scheduledEmails: {
        title: '📧 Correus electrònics programats',
        desc: 'Gestiona els teus correus electrònics programats. Pots cancel·lar-los abans que s\'enviïn.',
        empty: 'No hi ha correus electrònics programats. Els correus que programis apareixeran aquí.',
        cancelButton: '🗑️ Cancel·lar',
        canceling: 'Cancel·lant...',
        cancelSuccess: '✅ Correu electrònic cancel·lat correctament',
        cancelError: '❌ Error en cancel·lar el correu electrònic',
        past: '(Passat)'
      },
      mobileSettings: {
        title: '📱 Configuració Mòbil'
      },
      savedLocations: {
        title: '📍 Ubicacions Guardades',
        desc: 'Gestiona les teves ubicacions preferides. Aquestes apareixeran quan seleccionis \'Ubicació\' en crear una notificació.',
        addTitle: 'Afegir Nova Ubicació',
        addDesc: 'Obre el selector d\'ubicacions amb mapa per afegir una nova ubicació',
        addButton: '➕ Afegir Ubicació',
        empty: 'No hi ha ubicacions guardades. Fes clic a \'Afegir Ubicació\' per començar.',
        editButton: '✏️ Editar',
        deleteButton: '🗑️'
      }
    },
    commands: {
      processCurrentNote: 'Processar nota actual per a Notelert',
      processAllNotes: 'Processar totes les notes per a Notelert',
      clearProcessedHistory: 'Netejar historial de processament'
    },
    notices: {
      noActiveNote: 'No hi ha cap nota oberta per processar',
      processedNotes: 'Processades {count} notes per a Notelert',
      processedNote: 'Processada: {filename} ({count} notificacions)',
      clearedHistory: 'Historial de processament netejat',
      errorCreatingNotification: 'Error creant notificació: {title}',
      defaultTitle: 'Recordatori',
      desktopConfigRequired: '❌ Configura el teu email i API Key a Settings per usar Notelert a desktop',
      locationNotSupportedDesktop: '❌ Les notificacions d\'ubicació només estan disponibles a mòbil',
      emailScheduled: '✅ Email programat correctament'
    },
    modal: {
      title: 'Crear notificació a Notelert?',
      titleLabel: 'Títol:',
      dateLabel: 'Data:',
      timeLabel: 'Hora:',
      messageLabel: 'Missatge:',
      confirmButton: 'Sí, crear notificació',
      cancelButton: 'Cancel·lar'
    },
    datePicker: {
      title: 'Seleccionar data i hora',
      dateLabel: 'Data:',
      timeLabel: 'Hora:',
      quickActions: 'Accions ràpides:',
      today: 'Avui',
      tomorrow: 'Demà',
      in1Hour: 'En 1 hora',
      in2Hours: 'En 2 hores',
      confirmButton: 'Confirmar notificació',
      cancelButton: 'Cancel·lar',
      selectDateTime: 'Si us plau, selecciona una data i hora',
      notificationType: 'Tipus de notificació:',
      timeNotification: 'Temps',
      locationNotification: 'Ubicació',
      noSavedLocations: 'No hi ha ubicacions guardades. Ves a Settings per afegir ubicacions.',
      selectSavedLocation: 'Seleccionar Ubicació Guardada',
      hours: 'Hores',
      minutes: 'Minuts',
      selectLocationTitle: 'Selecciona una ubicació:',
      selectLocationTitle: 'Selecciona una ubicació:'
    },
    locationPicker: {
      title: 'Seleccionar Ubicació',
      searchPlaceholder: 'Buscar adreça o lloc...',
      radius: 'Radi (metres):',
      favorites: 'Ubicacions Favorites',
      cancelButton: 'Cancel·lar',
      confirmButton: 'Confirmar',
      noFavorites: 'No hi ha ubicacions guardades',
      selectButton: 'Seleccionar',
      deleteButton: 'Eliminar',
      saveFavorite: '⭐ Guardar',
      saved: '✓ Guardat',
      searching: 'Buscant...',
      noResults: 'No s\'han trobat resultats',
      error: 'Error en buscar ubicacions',
      connectionError: 'Error de connexió. Verifica la teva connexió a internet.',
      rateLimit: 'Massa sol·licituds. Espera un moment abans de buscar de nou.',
      apiKeyError: 'Error: API key no configurada o invàlida. Verifica la configuració.',
      selectLocation: 'Selecciona una ubicació dels resultats o de les teves favorites',
      locationSelected: 'Ubicació seleccionada',
      loadingMap: 'Carregant mapa...',
      debugMap: '🔍 Debug Mapa',
      mapError: '⚠️ Error',
      mapErrorTitle: 'Error en carregar el mapa',
      googleMapsError: 'Google Maps no s\'ha carregat correctament'
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
      examples: 'Exemples:',
      platformInfo: {
        desktopTitle: '💻 Mode Bureau',
        desktopDesc: 'Sur bureau, Notelert envoie des notifications par e-mail. Les notifications de localisation sont uniquement disponibles sur mobile.',
        mobileTitle: '📱 Mode Mobile',
        mobileDesc: 'Sur mobile, Notelert utilise l\'application pour envoyer des notifications push et des e-mails. Vous pouvez configurer des lieux favoris pour les rappels basés sur la localisation.'
      },
      basicSettings: 'Paramètres de base',
      pluginToken: {
        title: '🔑 Jeton du Plugin',
        descDesktop: 'Jeton d\'authentification pour utiliser le géocodage et les e-mails premium. Obtenez votre jeton depuis l\'application mobile dans Paramètres > Jeton du Plugin.',
        descMobile: 'Jeton d\'authentification pour utiliser le géocodage premium. Obtenez votre jeton depuis l\'application mobile dans Paramètres > Jeton du Plugin.',
        placeholder: 'Collez votre jeton ici...',
        showHide: 'Afficher/Masquer'
      },
      desktopSettings: {
        title: '💻 Paramètres Bureau',
        userEmailTitle: 'E-mail utilisateur (Optionnel)',
        userEmailDesc: 'E-mail où vous recevrez les notifications. Plus nécessaire si vous utilisez le jeton du plugin.',
        userEmailPlaceholder: 'utilisateur@email.com'
      },
      scheduledEmails: {
        title: '📧 E-mails programmés',
        desc: 'Gérez vos e-mails programmés. Vous pouvez les annuler avant qu\'ils ne soient envoyés.',
        empty: 'Aucun e-mail programmé. Les e-mails que vous programmez apparaîtront ici.',
        cancelButton: '🗑️ Annuler',
        canceling: 'Annulation...',
        cancelSuccess: '✅ E-mail annulé avec succès',
        cancelError: '❌ Erreur lors de l\'annulation de l\'e-mail',
        past: '(Passé)'
      },
      mobileSettings: {
        title: '📱 Paramètres Mobile'
      },
      savedLocations: {
        title: '📍 Lieux enregistrés',
        desc: 'Gérez vos lieux favoris. Ils apparaîtront lorsque vous sélectionnerez \'Lieu\' lors de la création d\'une notification.',
        addTitle: 'Ajouter un nouveau lieu',
        addDesc: 'Ouvrir le sélecteur de lieu avec carte pour ajouter un nouveau lieu',
        addButton: '➕ Ajouter un lieu',
        empty: 'Aucun lieu enregistré. Cliquez sur \'Ajouter un lieu\' pour commencer.',
        editButton: '✏️ Modifier',
        deleteButton: '🗑️'
      }
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
    },
    datePicker: {
      title: 'Sélectionner la date et l\'heure',
      dateLabel: 'Date:',
      timeLabel: 'Heure:',
      quickActions: 'Actions rapides:',
      today: 'Aujourd\'hui',
      tomorrow: 'Demain',
      in1Hour: 'Dans 1 heure',
      in2Hours: 'Dans 2 heures',
      confirmButton: 'Confirmer la notification',
      cancelButton: 'Annuler',
      selectDateTime: 'Veuillez sélectionner une date et une heure',
      notificationType: 'Type de notification:',
      timeNotification: 'Temps',
      locationNotification: 'Lieu',
      noSavedLocations: 'Aucun lieu enregistré. Allez dans Paramètres pour ajouter des lieux.',
      selectSavedLocation: 'Sélectionner un lieu enregistré',
      hours: 'Heures',
      minutes: 'Minutes',
      selectLocationTitle: 'Sélectionnez un lieu:'
    },
    locationPicker: {
      title: 'Sélectionner un lieu',
      searchPlaceholder: 'Rechercher une adresse ou un lieu...',
      radius: 'Rayon (mètres):',
      favorites: 'Lieux favoris',
      cancelButton: 'Annuler',
      confirmButton: 'Confirmer',
      noFavorites: 'Aucun lieu enregistré',
      selectButton: 'Sélectionner',
      deleteButton: 'Supprimer',
      saveFavorite: '⭐ Enregistrer',
      saved: '✓ Enregistré',
      searching: 'Recherche...',
      noResults: 'Aucun résultat trouvé',
      error: 'Erreur lors de la recherche de lieux',
      connectionError: 'Erreur de connexion. Vérifiez votre connexion internet.',
      rateLimit: 'Trop de demandes. Attendez un moment avant de rechercher à nouveau.',
      apiKeyError: 'Erreur: Clé API non configurée ou invalide. Vérifiez vos paramètres.',
      selectLocation: 'Sélectionnez un lieu parmi les résultats ou vos favoris',
      locationSelected: 'Lieu sélectionné',
      loadingMap: 'Chargement de la carte...',
      debugMap: '🔍 Debug Carte',
      mapError: '⚠️ Erreur',
      mapErrorTitle: 'Erreur lors du chargement de la carte',
      googleMapsError: 'Google Maps ne s\'est pas chargé correctement'
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
      examples: 'Beispiele:',
      platformInfo: {
        desktopTitle: '💻 Desktop-Modus',
        desktopDesc: 'Auf dem Desktop sendet Notelert E-Mail-Benachrichtigungen. Standortbenachrichtigungen sind nur auf Mobilgeräten verfügbar.',
        mobileTitle: '📱 Mobil-Modus',
        mobileDesc: 'Auf Mobilgeräten verwendet Notelert die App, um Push-Benachrichtigungen und E-Mails zu senden. Sie können Lieblingsorte für standortbezogene Erinnerungen konfigurieren.'
      },
      basicSettings: 'Grundeinstellungen',
      pluginToken: {
        title: '🔑 Plugin-Token',
        descDesktop: 'Authentifizierungstoken für Premium-Geocodierung und E-Mails. Holen Sie sich Ihr Token aus der mobilen App unter Einstellungen > Plugin-Token.',
        descMobile: 'Authentifizierungstoken für Premium-Geocodierung. Holen Sie sich Ihr Token aus der mobilen App unter Einstellungen > Plugin-Token.',
        placeholder: 'Fügen Sie Ihr Token hier ein...',
        showHide: 'Anzeigen/Verbergen'
      },
      desktopSettings: {
        title: '💻 Desktop-Einstellungen',
        userEmailTitle: 'Benutzer-E-Mail (Optional)',
        userEmailDesc: 'E-Mail, an die Sie Benachrichtigungen erhalten. Nicht mehr erforderlich, wenn Sie das Plugin-Token verwenden.',
        userEmailPlaceholder: 'benutzer@email.com'
      },
      scheduledEmails: {
        title: '📧 Geplante E-Mails',
        desc: 'Verwalten Sie Ihre geplanten E-Mails. Sie können sie stornieren, bevor sie gesendet werden.',
        empty: 'Keine geplanten E-Mails. E-Mails, die Sie planen, werden hier angezeigt.',
        cancelButton: '🗑️ Abbrechen',
        canceling: 'Abbrechen...',
        cancelSuccess: '✅ E-Mail erfolgreich abgebrochen',
        cancelError: '❌ Fehler beim Abbrechen der E-Mail',
        past: '(Vergangen)'
      },
      mobileSettings: {
        title: '📱 Mobile Einstellungen'
      },
      savedLocations: {
        title: '📍 Gespeicherte Orte',
        desc: 'Verwalten Sie Ihre Lieblingsorte. Diese erscheinen, wenn Sie \'Ort\' auswählen, wenn Sie eine Benachrichtigung erstellen.',
        addTitle: 'Neuen Ort hinzufügen',
        addDesc: 'Öffnen Sie die Standortauswahl mit Karte, um einen neuen Ort hinzuzufügen',
        addButton: '➕ Ort hinzufügen',
        empty: 'Keine gespeicherten Orte. Klicken Sie auf \'Ort hinzufügen\', um zu beginnen.',
        editButton: '✏️ Bearbeiten',
        deleteButton: '🗑️'
      }
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
      examples: 'Esempi:',
      platformInfo: {
        desktopTitle: '💻 Modalità Desktop',
        desktopDesc: 'Su desktop, Notelert invia notifiche via email. Le notifiche di posizione sono disponibili solo su mobile.',
        mobileTitle: '📱 Modalità Mobile',
        mobileDesc: 'Su mobile, Notelert usa l\'app per inviare notifiche push ed email. Puoi configurare luoghi preferiti per promemoria basati sulla posizione.'
      },
      basicSettings: 'Impostazioni di Base',
      pluginToken: {
        title: '🔑 Token del Plugin',
        descDesktop: 'Token di autenticazione per usare geocodifica ed email premium. Ottieni il tuo token dall\'app mobile in Impostazioni > Token del Plugin.',
        descMobile: 'Token di autenticazione per usare geocodifica premium. Ottieni il tuo token dall\'app mobile in Impostazioni > Token del Plugin.',
        placeholder: 'Incolla il tuo token qui...',
        showHide: 'Mostra/Nascondi'
      },
      desktopSettings: {
        title: '💻 Impostazioni Desktop',
        userEmailTitle: 'Email Utente (Opzionale)',
        userEmailDesc: 'Email dove riceverai le notifiche. Non più necessario se usi il token del plugin.',
        userEmailPlaceholder: 'utente@email.com'
      },
      scheduledEmails: {
        title: '📧 Email Programmate',
        desc: 'Gestisci le tue email programmate. Puoi annullarle prima che vengano inviate.',
        empty: 'Nessuna email programmata. Le email che programmi appariranno qui.',
        cancelButton: '🗑️ Annulla',
        canceling: 'Annullamento...',
        cancelSuccess: '✅ Email annullata con successo',
        cancelError: '❌ Errore durante l\'annullamento dell\'email',
        past: '(Passato)'
      },
      mobileSettings: {
        title: '📱 Impostazioni Mobile'
      },
      savedLocations: {
        title: '📍 Luoghi Salvati',
        desc: 'Gestisci i tuoi luoghi preferiti. Questi appariranno quando selezioni \'Posizione\' durante la creazione di una notifica.',
        addTitle: 'Aggiungi Nuovo Luogo',
        addDesc: 'Apri il selettore di posizione con mappa per aggiungere un nuovo luogo',
        addButton: '➕ Aggiungi Luogo',
        empty: 'Nessun luogo salvato. Clicca su \'Aggiungi Luogo\' per iniziare.',
        editButton: '✏️ Modifica',
        deleteButton: '🗑️'
      }
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
      examples: 'Exemplos:',
      platformInfo: {
        desktopTitle: '💻 Modo Desktop',
        desktopDesc: 'No desktop, Notelert envia notificações por e-mail. As notificações de localização estão disponíveis apenas no celular.',
        mobileTitle: '📱 Modo Móvel',
        mobileDesc: 'No celular, Notelert usa o aplicativo para enviar notificações push e e-mails. Você pode configurar locais favoritos para lembretes baseados em localização.'
      },
      basicSettings: 'Configurações Básicas',
      pluginToken: {
        title: '🔑 Token do Plugin',
        descDesktop: 'Token de autenticação para usar geocodificação e e-mails premium. Obtenha seu token no aplicativo móvel em Configurações > Token do Plugin.',
        descMobile: 'Token de autenticação para usar geocodificação premium. Obtenha seu token no aplicativo móvel em Configurações > Token do Plugin.',
        placeholder: 'Cole seu token aqui...',
        showHide: 'Mostrar/Ocultar'
      },
      desktopSettings: {
        title: '💻 Configurações de Desktop',
        userEmailTitle: 'E-mail do Usuário (Opcional)',
        userEmailDesc: 'E-mail onde você receberá as notificações. Não é mais necessário se usar o token do plugin.',
        userEmailPlaceholder: 'usuario@email.com'
      },
      scheduledEmails: {
        title: '📧 E-mails Agendados',
        desc: 'Gerencie seus e-mails agendados. Você pode cancelá-los antes que sejam enviados.',
        empty: 'Nenhum e-mail agendado. Os e-mails que você agendar aparecerão aqui.',
        cancelButton: '🗑️ Cancelar',
        canceling: 'Cancelando...',
        cancelSuccess: '✅ E-mail cancelado com sucesso',
        cancelError: '❌ Erro ao cancelar e-mail',
        past: '(Passado)'
      },
      mobileSettings: {
        title: '📱 Configurações Móveis'
      },
      savedLocations: {
        title: '📍 Locais Salvos',
        desc: 'Gerencie seus locais favoritos. Eles aparecerão quando você selecionar \'Localização\' ao criar uma notificação.',
        addTitle: 'Adicionar Novo Local',
        addDesc: 'Abrir seletor de localização com mapa para adicionar um novo local',
        addButton: '➕ Adicionar Local',
        empty: 'Nenhum local salvo. Clique em \'Adicionar Local\' para começar.',
        editButton: '✏️ Editar',
        deleteButton: '🗑️'
      }
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
      examples: 'Примеры:',
      platformInfo: {
        desktopTitle: '💻 Режим рабочего стола',
        desktopDesc: 'На рабочем столе Notelert отправляет уведомления по электронной почте. Уведомления о местоположении доступны только на мобильных устройствах.',
        mobileTitle: '📱 Мобильный режим',
        mobileDesc: 'На мобильном устройстве Notelert использует приложение для отправки push-уведомлений и электронных писем. Вы можете настроить любимые места для напоминаний на основе местоположения.'
      },
      basicSettings: 'Основные настройки',
      pluginToken: {
        title: '🔑 Токен плагина',
        descDesktop: 'Токен аутентификации для использования премиум-геокодирования и электронной почты. Получите токен в мобильном приложении в Настройки > Токен плагина.',
        descMobile: 'Токен аутентификации для использования премиум-геокодирования. Получите токен в мобильном приложении в Настройки > Токен плагина.',
        placeholder: 'Вставьте ваш токен здесь...',
        showHide: 'Показать/Скрыть'
      },
      desktopSettings: {
        title: '💻 Настройки рабочего стола',
        userEmailTitle: 'Email пользователя (необязательно)',
        userEmailDesc: 'Email, на который вы будете получать уведомления. Больше не требуется, если используется токен плагина.',
        userEmailPlaceholder: 'user@email.com'
      },
      scheduledEmails: {
        title: '📧 Запланированные письма',
        desc: 'Управляйте запланированными письмами. Вы можете отменить их до отправки.',
        empty: 'Нет запланированных писем. Письма, которые вы запланируете, появятся здесь.',
        cancelButton: '🗑️ Отменить',
        canceling: 'Отмена...',
        cancelSuccess: '✅ Письмо успешно отменено',
        cancelError: '❌ Ошибка при отмене письма',
        past: '(Прошедшее)'
      },
      mobileSettings: {
        title: '📱 Мобильные настройки'
      },
      savedLocations: {
        title: '📍 Сохраненные места',
        desc: 'Управляйте любимыми местами. Они появятся при выборе "Местоположение" при создании уведомления.',
        addTitle: 'Добавить новое место',
        addDesc: 'Открыть выбор местоположения с картой для добавления нового места',
        addButton: '➕ Добавить место',
        empty: 'Нет сохраненных мест. Нажмите "Добавить место", чтобы начать.',
        editButton: '✏️ Редактировать',
        deleteButton: '🗑️'
      }
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
      examples: '例:',
      platformInfo: {
        desktopTitle: '💻 デスクトップモード',
        desktopDesc: 'デスクトップでは、Notelertはメール通知を送信します。位置情報通知はモバイルでのみ利用可能です。',
        mobileTitle: '📱 モバイルモード',
        mobileDesc: 'モバイルでは、Notelertはアプリを使用してプッシュ通知とメールを送信します。位置情報に基づくリマインダー用にお気に入りの場所を設定できます。'
      },
      basicSettings: '基本設定',
      pluginToken: {
        title: '🔑 プラグイントークン',
        descDesktop: 'プレミアムジオコーディングとメールを使用するための認証トークン。モバイルアプリの設定 > プラグイントークンからトークンを取得してください。',
        descMobile: 'プレミアムジオコーディングを使用するための認証トークン。モバイルアプリの設定 > プラグイントークンからトークンを取得してください。',
        placeholder: 'ここにトークンを貼り付けてください...',
        showHide: '表示/非表示'
      },
      desktopSettings: {
        title: '💻 デスクトップ設定',
        userEmailTitle: 'ユーザーメール（オプション）',
        userEmailDesc: '通知を受け取るメールアドレス。プラグイントークンを使用している場合は不要です。',
        userEmailPlaceholder: 'user@email.com'
      },
      scheduledEmails: {
        title: '📧 予約済みメール',
        desc: '予約済みメールを管理します。送信前にキャンセルできます。',
        empty: '予約済みメールはありません。予約したメールはここに表示されます。',
        cancelButton: '🗑️ キャンセル',
        canceling: 'キャンセル中...',
        cancelSuccess: '✅ メールが正常にキャンセルされました',
        cancelError: '❌ メールのキャンセルエラー',
        past: '(過去)'
      },
      mobileSettings: {
        title: '📱 モバイル設定'
      },
      savedLocations: {
        title: '📍 保存された場所',
        desc: 'お気に入りの場所を管理します。通知を作成する際に「場所」を選択すると表示されます。',
        addTitle: '新しい場所を追加',
        addDesc: '地図付きの場所選択を開いて新しい場所を追加します',
        addButton: '➕ 場所を追加',
        empty: '保存された場所はありません。「場所を追加」をクリックして開始してください。',
        editButton: '✏️ 編集',
        deleteButton: '🗑️'
      }
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
      examples: '示例:',
      platformInfo: {
        desktopTitle: '💻 桌面模式',
        desktopDesc: '在桌面上，Notelert发送电子邮件通知。位置通知仅在移动设备上可用。',
        mobileTitle: '📱 移动模式',
        mobileDesc: '在移动设备上，Notelert使用应用程序发送推送通知和电子邮件。您可以配置常用位置以进行基于位置的提醒。'
      },
      basicSettings: '基本设置',
      pluginToken: {
        title: '🔑 插件令牌',
        descDesktop: '用于高级地理编码和电子邮件的身份验证令牌。从移动应用程序的设置 > 插件令牌中获取您的令牌。',
        descMobile: '用于高级地理编码的身份验证令牌。从移动应用程序的设置 > 插件令牌中获取您的令牌。',
        placeholder: '在此处粘贴您的令牌...',
        showHide: '显示/隐藏'
      },
      desktopSettings: {
        title: '💻 桌面设置',
        userEmailTitle: '用户电子邮件（可选）',
        userEmailDesc: '您将接收通知的电子邮件。如果使用插件令牌，则不再需要。',
        userEmailPlaceholder: 'user@email.com'
      },
      scheduledEmails: {
        title: '📧 预定电子邮件',
        desc: '管理您的预定电子邮件。您可以在发送之前取消它们。',
        empty: '没有预定的电子邮件。您预定的电子邮件将显示在这里。',
        cancelButton: '🗑️ 取消',
        canceling: '正在取消...',
        cancelSuccess: '✅ 电子邮件已成功取消',
        cancelError: '❌ 取消电子邮件时出错',
        past: '(过去)'
      },
      mobileSettings: {
        title: '📱 移动设置'
      },
      savedLocations: {
        title: '📍 已保存的位置',
        desc: '管理您的常用位置。创建通知时选择“位置”时会出现这些位置。',
        addTitle: '添加新位置',
        addDesc: '打开带地图的位置选择器以添加新位置',
        addButton: '➕ 添加位置',
        empty: '没有已保存的位置。点击“添加位置”开始。',
        editButton: '✏️ 编辑',
        deleteButton: '🗑️'
      }
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
      examples: 'أمثلة:',
      platformInfo: {
        desktopTitle: '💻 وضع سطح المكتب',
        desktopDesc: 'على سطح المكتب، يرسل Notelert إشعارات عبر البريد الإلكتروني. إشعارات الموقع متاحة فقط على الهاتف المحمول.',
        mobileTitle: '📱 وضع الهاتف المحمول',
        mobileDesc: 'على الهاتف المحمول، يستخدم Notelert التطبيق لإرسال إشعارات الدفع ورسائل البريد الإلكتروني. يمكنك تكوين المواقع المفضلة للتذكيرات المستندة إلى الموقع.'
      },
      basicSettings: 'الإعدادات الأساسية',
      pluginToken: {
        title: '🔑 رمز البرنامج المساعد',
        descDesktop: 'رمز المصادقة لاستخدام الترميز الجغرافي المتميز ورسائل البريد الإلكتروني. احصل على الرمز الخاص بك من تطبيق الهاتف المحمول في الإعدادات > رمز البرنامج المساعد.',
        descMobile: 'رمز المصادقة لاستخدام الترميز الجغرافي المتميز. احصل على الرمز الخاص بك من تطبيق الهاتف المحمول في الإعدادات > رمز البرنامج المساعد.',
        placeholder: 'الصق الرمز الخاص بك هنا...',
        showHide: 'إظهار/إخفاء'
      },
      desktopSettings: {
        title: '💻 إعدادات سطح المكتب',
        userEmailTitle: 'البريد الإلكتروني للمستخدم (اختياري)',
        userEmailDesc: 'البريد الإلكتروني الذي ستتلقى فيه الإشعارات. لم يعد ضروريًا إذا كنت تستخدم رمز البرنامج المساعد.',
        userEmailPlaceholder: 'user@email.com'
      },
      scheduledEmails: {
        title: '📧 رسائل البريد الإلكتروني المجدولة',
        desc: 'إدارة رسائل البريد الإلكتروني المجدولة الخاصة بك. يمكنك إلغاؤها قبل إرسالها.',
        empty: 'لا توجد رسائل بريد إلكتروني مجدولة. ستظهر رسائل البريد الإلكتروني التي تجدولها هنا.',
        cancelButton: '🗑️ إلغاء',
        canceling: 'جاري الإلغاء...',
        cancelSuccess: '✅ تم إلغاء البريد الإلكتروني بنجاح',
        cancelError: '❌ خطأ في إلغاء البريد الإلكتروني',
        past: '(سابق)'
      },
      mobileSettings: {
        title: '📱 إعدادات الهاتف المحمول'
      },
      savedLocations: {
        title: '📍 المواقع المحفوظة',
        desc: 'إدارة مواقعك المفضلة. ستظهر هذه عند تحديد "الموقع" عند إنشاء إشعار.',
        addTitle: 'إضافة موقع جديد',
        addDesc: 'فتح محدد الموقع مع الخريطة لإضافة موقع جديد',
        addButton: '➕ إضافة موقع',
        empty: 'لا توجد مواقع محفوظة. انقر فوق "إضافة موقع" للبدء.',
        editButton: '✏️ تحرير',
        deleteButton: '🗑️'
      }
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
