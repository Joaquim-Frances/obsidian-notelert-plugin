import {
  App,
  Modal,
  Notice,
  Plugin,
  PluginSettingTab,
  Setting,
  TFile,
  WorkspaceLeaf,
  SuggestModal,
} from "obsidian";
import { 
  SUPPORTED_LANGUAGES, 
  TRANSLATIONS, 
  getTranslation, 
  getLanguageByCode, 
  getDefaultLanguage,
  Language 
} from "./i18n";

// Interfaces para configuración y detección de patrones
interface NotelertSettings {
  autoProcess: boolean;
  processOnSave: boolean;
  processOnOpen: boolean;
  debugMode: boolean;
  language: string;
  customPatterns: string[];
  excludedFolders: string[];
  debounceDelay: number; // Tiempo de espera en milisegundos
  useDebounce: boolean; // Activar/desactivar el sistema de debounce
  showConfirmationModal: boolean; // Mostrar modal de confirmación antes de crear notificaciones
  addVisualIndicators: boolean; // Añadir iconos visuales a recordatorios procesados
  visualIndicatorIcon: string; // Icono a usar para indicar recordatorios procesados
  useNewSyntax: boolean; // Usar nuevo sistema de sintaxis {@fecha, hora}
  enableDatePicker: boolean; // Activar date picker al escribir {@
}

interface DetectedPattern {
  text: string;
  title: string;
  message: string;
  date: string;
  time: string;
  fullMatch: string;
  startIndex: number;
  endIndex: number;
  filePath?: string; // Ruta del archivo donde se detectó el patrón
  lineNumber?: number; // Número de línea donde se detectó el patrón
  location?: string; // Nombre de la ubicación
  latitude?: number; // Latitud de la ubicación
  longitude?: number; // Longitud de la ubicación
  radius?: number; // Radio en metros para la geofence
}

// Modal de confirmación para notificaciones
class NotelertConfirmationModal extends Modal {
  private pattern: DetectedPattern;
  private onConfirm: (pattern: DetectedPattern) => void;
  private onCancel: () => void;
  private language: string;

  constructor(app: App, pattern: DetectedPattern, language: string, onConfirm: (pattern: DetectedPattern) => void, onCancel: () => void) {
    super(app);
    this.pattern = pattern;
    this.language = language;
    this.onConfirm = onConfirm;
    this.onCancel = onCancel;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl("h2", { text: getTranslation(this.language, "modal.title") });

    // Mostrar información de la notificación
    const infoDiv = contentEl.createEl("div", { cls: "notelert-modal-info" });
    infoDiv.setAttribute("style", "margin: 20px 0; padding: 15px; background: var(--background-secondary); border-radius: 6px;");
    
    const titleP = infoDiv.createEl("p", { text: `${getTranslation(this.language, "modal.titleLabel")} ${this.pattern.title}` });
    titleP.setAttribute("style", "margin: 8px 0; font-weight: 500;");
    
    const dateP = infoDiv.createEl("p", { text: `${getTranslation(this.language, "modal.dateLabel")} ${this.pattern.date}` });
    dateP.setAttribute("style", "margin: 8px 0;");
    
    const timeP = infoDiv.createEl("p", { text: `${getTranslation(this.language, "modal.timeLabel")} ${this.pattern.time}` });
    timeP.setAttribute("style", "margin: 8px 0;");
    
    const messageP = infoDiv.createEl("p", { text: `${getTranslation(this.language, "modal.messageLabel")} ${this.pattern.message}` });
    messageP.setAttribute("style", "margin: 8px 0;");

    // Botones con mejor espaciado
    const buttonContainer = contentEl.createEl("div", { cls: "notelert-modal-buttons" });
    buttonContainer.setAttribute("style", "display: flex; gap: 12px; justify-content: flex-end; margin-top: 20px;");
    
    const cancelButton = buttonContainer.createEl("button", { 
      text: getTranslation(this.language, "modal.cancelButton"),
      cls: "mod-secondary"
    });
    cancelButton.addEventListener("click", () => {
      this.onCancel();
      this.close();
    });

    const confirmButton = buttonContainer.createEl("button", { 
      text: getTranslation(this.language, "modal.confirmButton"),
      cls: "mod-cta"
    });
    confirmButton.addEventListener("click", () => {
      this.onConfirm(this.pattern);
      this.close();
    });
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}

// Modal para seleccionar fecha y hora
class NotelertDatePickerModal extends Modal {
  private onConfirm: (date: string, time: string) => void;
  private onCancel: () => void;
  private language: string;
  private plugin: NotelertPlugin;
  private editor: any;
  private cursor: any;
  private originalText: string;

  constructor(app: App, plugin: NotelertPlugin, language: string, editor: any, cursor: any, originalText: string, onCancel: () => void) {
    super(app);
    this.plugin = plugin;
    this.language = language;
    this.editor = editor;
    this.cursor = cursor;
    this.originalText = originalText;
    this.onCancel = onCancel;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl("h2", { text: getTranslation(this.language, "datePicker.title") });

    // Contenedor principal
    const container = contentEl.createEl("div", { cls: "notelert-datepicker-container" });
    container.setAttribute("style", "margin: 20px 0;");

    // Selector de fecha
    const dateContainer = container.createEl("div", { cls: "notelert-date-container" });
    dateContainer.setAttribute("style", "margin-bottom: 15px;");
    
    const dateLabel = dateContainer.createEl("label", { text: getTranslation(this.language, "datePicker.dateLabel") });
    dateLabel.setAttribute("style", "display: block; margin-bottom: 5px; font-weight: 500;");
    
    const dateInput = dateContainer.createEl("input", {
      type: "date",
      cls: "notelert-date-input"
    });
    dateInput.setAttribute("style", "width: 100%; padding: 8px; border: 1px solid var(--background-modifier-border); border-radius: 4px;");

    // Selector de hora
    const timeContainer = container.createEl("div", { cls: "notelert-time-container" });
    timeContainer.setAttribute("style", "margin-bottom: 20px;");
    
    const timeLabel = timeContainer.createEl("label", { text: getTranslation(this.language, "datePicker.timeLabel") });
    timeLabel.setAttribute("style", "display: block; margin-bottom: 5px; font-weight: 500;");
    
    const timeInput = timeContainer.createEl("input", {
      type: "time",
      cls: "notelert-time-input"
    });
    timeInput.setAttribute("style", "width: 100%; padding: 8px; border: 1px solid var(--background-modifier-border); border-radius: 4px;");

    // Botones de acción rápida
    const quickActions = container.createEl("div", { cls: "notelert-quick-actions" });
    quickActions.setAttribute("style", "margin-bottom: 20px;");
    
    const quickActionsTitle = quickActions.createEl("p", { text: getTranslation(this.language, "datePicker.quickActions") });
    quickActionsTitle.setAttribute("style", "margin-bottom: 10px; font-weight: 500;");

    const quickButtonsContainer = quickActions.createEl("div");
    quickButtonsContainer.setAttribute("style", "display: flex; gap: 8px; flex-wrap: wrap;");

    // Botones de acciones rápidas
    const quickActionsData = [
      { label: getTranslation(this.language, "datePicker.today"), date: this.getToday(), time: "09:00" },
      { label: getTranslation(this.language, "datePicker.tomorrow"), date: this.getTomorrow(), time: "09:00" },
      { label: getTranslation(this.language, "datePicker.in1Hour"), date: this.getToday(), time: this.getTimeInHours(1) },
      { label: getTranslation(this.language, "datePicker.in2Hours"), date: this.getToday(), time: this.getTimeInHours(2) },
    ];

    quickActionsData.forEach(action => {
      const button = quickButtonsContainer.createEl("button", {
        text: action.label,
        cls: "mod-secondary"
      });
      button.setAttribute("style", "padding: 4px 8px; font-size: 12px;");
      button.addEventListener("click", () => {
        dateInput.value = action.date;
        timeInput.value = action.time;
      });
    });

    // Botones principales
    const buttonContainer = container.createEl("div", { cls: "notelert-datepicker-buttons" });
    buttonContainer.setAttribute("style", "display: flex; gap: 12px; justify-content: flex-end; margin-top: 20px;");
    
    const cancelButton = buttonContainer.createEl("button", { 
      text: getTranslation(this.language, "datePicker.cancelButton"),
      cls: "mod-secondary"
    });
    cancelButton.addEventListener("click", () => {
      this.onCancel();
      this.close();
    });

    const confirmButton = buttonContainer.createEl("button", { 
      text: getTranslation(this.language, "datePicker.confirmButton"),
      cls: "mod-cta"
    });
    confirmButton.addEventListener("click", async () => {
      const date = dateInput.value;
      const time = timeInput.value;
      
      if (date && time) {
        // Reemplazar :@ con :@fecha, hora
        const replacement = `:@${date}, ${time}`;
        const line = this.editor.getLine(this.cursor.line);
        const beforeCursor = line.substring(0, this.cursor.ch - 2); // Quitar :@
        const afterCursor = line.substring(this.cursor.ch);
        const newLine = beforeCursor + replacement + afterCursor;
        
        this.editor.setLine(this.cursor.line, newLine);
        
        // Mover cursor al final del reemplazo
        const newCursor = {
          line: this.cursor.line,
          ch: beforeCursor.length + replacement.length
        };
        this.editor.setCursor(newCursor);
        
        // Crear la notificación directamente
        await this.createNotificationFromDatePicker(date, time, newLine);
        
        this.close();
      } else {
        new Notice(getTranslation(this.language, "datePicker.selectDateTime"));
      }
    });

    // Establecer valores por defecto
    dateInput.value = this.getToday();
    timeInput.value = this.getTimeInHours(1);
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }

  private getToday(): string {
    return new Date().toISOString().split('T')[0];
  }

  private getTomorrow(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  private getTimeInHours(hours: number): string {
    const now = new Date();
    now.setHours(now.getHours() + hours);
    return now.toTimeString().slice(0, 5);
  }

  // Crear notificación directamente desde el date picker
  private async createNotificationFromDatePicker(date: string, time: string, fullText: string) {
    try {
      // Crear el patrón detectado
      const pattern: DetectedPattern = {
        text: fullText.trim(),
        title: this.extractTitleFromText(fullText, `:@${date}, ${time}`),
        message: fullText.trim(),
        date: date,
        time: time,
        fullMatch: `:@${date}, ${time}`,
        startIndex: 0,
        endIndex: fullText.length,
        filePath: this.plugin.app.workspace.getActiveFile()?.path,
        lineNumber: this.cursor.line + 1,
      };

      // Crear la notificación directamente
      await this.plugin.createNotificationAndMarkProcessed(pattern);
      
      // TEMPORALMENTE COMENTADO - Debug para identificar el problema del guardado continuo
      // // Añadir feedback visual con un pequeño delay para evitar conflictos con el guardado
      // // Esto permite que Obsidian termine de procesar el deeplink antes de modificar el editor
      // setTimeout(() => {
      //   try {
      //     this.addVisualFeedback(fullText, `:@${date}, ${time}`);
      //   } catch (error) {
      //     this.plugin.log(`Error añadiendo feedback visual: ${error}`);
      //   }
      // }, 500);
      
      // TEMPORALMENTE COMENTADO - Debug
      // this.plugin.log(`Notificación creada desde date picker: ${pattern.title}`);
    } catch (error) {
      this.plugin.log(`Error creando notificación desde date picker: ${error}`);
      new Notice(getTranslation(this.language, "notices.errorCreatingNotification", { title: "Recordatorio" }));
    }
  }

  // Extraer título del texto
  private extractTitleFromText(text: string, match: string): string {
    // Remover el patrón :@fecha, hora del texto
    let title = text.replace(match, '').trim();
    
    // Limpiar espacios extra
    title = title.replace(/\s+/g, ' ').trim();
    
    // Limitar longitud
    if (title.length > 50) {
      title = title.substring(0, 47) + '...';
    }
    
    return title || 'Recordatorio';
  }

  // Añadir feedback visual: reemplazar :@ con icono de despertador y resaltar solo fecha/hora
  private addVisualFeedback(fullText: string, match: string) {
    try {
      // Extraer fecha y hora del match
      const matchParts = match.match(/:@([^,]+),\s*([^\s]+)/);
      if (matchParts) {
        const date = matchParts[1];
        const time = matchParts[2];
        
        // Crear el texto visual: reemplazar :@ con ⏰ y resaltar solo la parte de fecha/hora
        const dateTimePart = `⏰${date}, ${time}`;
        const highlightedDateTime = `==${dateTimePart}==`;
        const visualText = fullText.replace(match, highlightedDateTime);
        
        // Actualizar la línea en el editor con el texto visual
        this.editor.setLine(this.cursor.line, visualText);
        
        this.plugin.log(`Feedback visual añadido: solo ${dateTimePart} resaltado`);
      }
    } catch (error) {
      this.plugin.log(`Error añadiendo feedback visual: ${error}`);
    }
  }
}

// Modal para seleccionar ubicación
class NotelertLocationPickerModal extends Modal {
  private plugin: NotelertPlugin;
  private language: string;
  private editor: any;
  private cursor: any;
  private originalText: string;
  private onCancel: () => void;

  constructor(
    app: App,
    plugin: NotelertPlugin,
    language: string,
    editor: any,
    cursor: any,
    originalText: string,
    onCancel: () => void
  ) {
    super(app);
    this.plugin = plugin;
    this.language = language;
    this.editor = editor;
    this.cursor = cursor;
    this.originalText = originalText;
    this.onCancel = onCancel;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl("h2", { text: getTranslation(this.language, "locationPicker.title") || "Seleccionar Ubicación" });

    // Input para buscar ubicación
    const searchContainer = contentEl.createEl("div", { cls: "notelert-location-search" });
    searchContainer.setAttribute("style", "margin: 20px 0;");
    
    const searchInput = searchContainer.createEl("input", {
      type: "text",
      placeholder: getTranslation(this.language, "locationPicker.searchPlaceholder") || "Buscar ubicación...",
      cls: "notelert-location-input"
    });
    searchInput.setAttribute("style", "width: 100%; padding: 10px; border: 1px solid var(--background-modifier-border); border-radius: 4px;");

    // Botones de acción rápida (ubicaciones comunes)
    const quickActionsContainer = contentEl.createEl("div", { cls: "notelert-location-quick-actions" });
    quickActionsContainer.setAttribute("style", "margin: 20px 0; display: flex; flex-wrap: wrap; gap: 10px;");
    
    const quickLocations = [
      { name: "Casa", lat: 0, lon: 0, radius: 100 },
      { name: "Trabajo", lat: 0, lon: 0, radius: 100 },
      { name: "Supermercado", lat: 0, lon: 0, radius: 200 }
    ];

    quickLocations.forEach(location => {
      const button = quickActionsContainer.createEl("button", {
        text: location.name,
        cls: "mod-secondary"
      });
      button.setAttribute("style", "padding: 8px 16px;");
      button.addEventListener("click", () => {
        this.createNotificationFromLocation(location.name, location.lat, location.lon, location.radius);
        this.close();
      });
    });

    // Botones principales
    const buttonContainer = contentEl.createEl("div", { cls: "notelert-locationpicker-buttons" });
    buttonContainer.setAttribute("style", "display: flex; gap: 12px; justify-content: flex-end; margin-top: 20px;");
    
    const cancelButton = buttonContainer.createEl("button", { 
      text: getTranslation(this.language, "locationPicker.cancelButton") || "Cancelar",
      cls: "mod-secondary"
    });
    cancelButton.addEventListener("click", () => {
      this.onCancel();
      this.close();
    });

    const confirmButton = buttonContainer.createEl("button", { 
      text: getTranslation(this.language, "locationPicker.confirmButton") || "Confirmar",
      cls: "mod-cta"
    });
    confirmButton.addEventListener("click", () => {
      const locationName = searchInput.value.trim();
      if (locationName) {
        // Por ahora usamos coordenadas por defecto (0,0) - la app móvil deberá geocodificar
        this.createNotificationFromLocation(locationName, 0, 0, 100);
        this.close();
      } else {
        new Notice(getTranslation(this.language, "locationPicker.selectLocation") || "Por favor, selecciona una ubicación");
      }
    });
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }

  // Crear notificación directamente desde el location picker
  private async createNotificationFromLocation(locationName: string, latitude: number, longitude: number, radius: number) {
    try {
      // Reemplazar :# con :#nombreUbicacion
      const replacement = `:#${locationName}`;
      const line = this.editor.getLine(this.cursor.line);
      const beforeCursor = line.substring(0, this.cursor.ch - 2); // Quitar :#
      const afterCursor = line.substring(this.cursor.ch);
      const newLine = beforeCursor + replacement + afterCursor;
      
      this.editor.setLine(this.cursor.line, newLine);
      
      // Mover cursor al final del reemplazo
      const newCursor = {
        line: this.cursor.line,
        ch: beforeCursor.length + replacement.length
      };
      this.editor.setCursor(newCursor);

      // Crear el patrón detectado
      const pattern: DetectedPattern = {
        text: newLine.trim(),
        title: this.extractTitleFromText(newLine, replacement),
        message: newLine.trim(),
        date: new Date().toISOString().split('T')[0], // Fecha actual por defecto
        time: "00:00", // Hora por defecto para recordatorios de ubicación
        fullMatch: replacement,
        startIndex: 0,
        endIndex: newLine.length,
        filePath: this.plugin.app.workspace.getActiveFile()?.path,
        lineNumber: this.cursor.line + 1,
        location: locationName,
        latitude: latitude,
        longitude: longitude,
        radius: radius
      };

      // Crear la notificación directamente
      await this.plugin.createNotificationAndMarkProcessed(pattern);
      
      this.plugin.log(`Notificación de ubicación creada: ${pattern.title} en ${locationName}`);
    } catch (error) {
      this.plugin.log(`Error creando notificación de ubicación: ${error}`);
      new Notice(getTranslation(this.language, "notices.errorCreatingNotification", { title: "Recordatorio de ubicación" }));
    }
  }

  // Extraer título del texto
  private extractTitleFromText(text: string, match: string): string {
    // Remover el patrón :#ubicación del texto
    let title = text.replace(match, '').trim();
    
    // Limpiar espacios extra
    title = title.replace(/\s+/g, ' ').trim();
    
    // Limitar longitud
    if (title.length > 50) {
      title = title.substring(0, 47) + '...';
    }
    
    return title || 'Recordatorio de ubicación';
  }
}

const DEFAULT_SETTINGS: NotelertSettings = {
  autoProcess: false, // Desactivado - solo a través del date picker
  processOnSave: false, // Desactivado - solo a través del date picker
  processOnOpen: false,
  debugMode: false,
  language: "es", // Spanish as default
  customPatterns: [],
  excludedFolders: ["Templates", "Archive", "Trash"],
  debounceDelay: 3000, // 3 segundos por defecto
  useDebounce: false, // Desactivado - no necesario
  showConfirmationModal: false, // Desactivado por defecto
  addVisualIndicators: false, // Desactivado - usamos feedback visual personalizado
  visualIndicatorIcon: "⏰", // Icono de reloj por defecto
  useNewSyntax: true, // Activar nuevo sistema por defecto
  enableDatePicker: true, // Activar date picker por defecto
};

export default class NotelertPlugin extends Plugin {
  settings: NotelertSettings;

  async onload() {
    console.log("Cargando plugin Notelert...");
    await this.loadSettings();

    // Comandos de procesamiento desactivados - solo funciona con :@

    // Configuración del plugin
    this.addSettingTab(new NotelertSettingTab(this.app, this));

    // Procesamiento automático desactivado - solo funciona con :@

    // Barra de estado
    this.addStatusBarItem().setText("Notelert: Activo");

    // Evento para detectar {@ y abrir date picker
    if (this.settings.enableDatePicker) {
      this.registerEvent(
        this.app.workspace.on("editor-change", (editor, info) => {
          this.handleEditorChange(editor, info);
        })
      );
    }

    console.log("Plugin Notelert cargado correctamente");
  }

  onunload() {
    console.log("Descargando plugin Notelert...");
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  // Manejar cambios en el editor para detectar :@ y :#
  private handleEditorChange(editor: any, info: any) {
    if (!this.settings.enableDatePicker || !this.settings.useNewSyntax) return;
    
    const cursor = editor.getCursor();
    const line = editor.getLine(cursor.line);
    const beforeCursor = line.substring(0, cursor.ch);
    
    // Detectar si se acaba de escribir :@
    if (beforeCursor.endsWith(':@')) {
      this.log("Detectado :@ - abriendo date picker");
      this.openDatePicker(editor, cursor);
      return;
    }
    
    // Detectar si se acaba de escribir :#
    if (beforeCursor.endsWith(':#')) {
      this.log("Detectado :# - abriendo location picker");
      this.openLocationPicker(editor, cursor);
    }
  }

  // Abrir date picker y reemplazar :@ con la fecha/hora seleccionada
  private openDatePicker(editor: any, cursor: any) {
    const line = editor.getLine(cursor.line);
    const originalText = line;
    
    new NotelertDatePickerModal(
      this.app,
      this,
      this.settings.language,
      editor,
      cursor,
      originalText,
      () => {
        this.log("Date picker cancelado");
      }
    ).open();
  }

  // Abrir location picker y reemplazar :# con la ubicación seleccionada
  private openLocationPicker(editor: any, cursor: any) {
    const line = editor.getLine(cursor.line);
    const originalText = line;
    
    new NotelertLocationPickerModal(
      this.app,
      this,
      this.settings.language,
      editor,
      cursor,
      originalText,
      () => {
        this.log("Location picker cancelado");
      }
    ).open();
  }

  // Métodos de escaneo automático eliminados - solo funciona con :@

  // Crear la notificación (función separada para reutilizar)
  private async createNotification(pattern: DetectedPattern) {
    try {
      const deeplink = this.generateDeepLink(pattern);
      this.log(`Ejecutando deeplink: ${deeplink}`);
      
      // Método simplificado para abrir el deeplink sin causar problemas de guardado
      // Usar location.href directamente es más simple y menos propenso a causar conflictos
      if (typeof window !== 'undefined') {
        window.location.href = deeplink;
      }

      // No modificamos el archivo aquí para evitar conflictos
      // El feedback visual ya se maneja en addVisualFeedback del DatePickerModal
      
    } catch (error) {
      this.log(`Error ejecutando deeplink: ${error}`);
      new Notice(getTranslation(this.settings.language, "notices.errorCreatingNotification", { title: pattern.title }));
    }
  }

  // Crear notificación y marcarla como procesada (para uso con modal)
  public async createNotificationAndMarkProcessed(pattern: DetectedPattern) {
    try {
      // Crear la notificación
      await this.createNotification(pattern);
      
      // TEMPORALMENTE COMENTADO - Debug para identificar el problema del guardado continuo
      // // Mostrar notificación de éxito
      // new Notice(getTranslation(this.settings.language, "notices.notificationCreated", { title: pattern.title }));
    } catch (error) {
      this.log(`Error procesando notificación confirmada: ${error}`);
      // TEMPORALMENTE COMENTADO - Debug
      // new Notice(getTranslation(this.settings.language, "notices.errorCreatingNotification", { title: pattern.title }));
    }
  }

  // Generar deeplink para Notelert
  private generateDeepLink(pattern: DetectedPattern): string {
    const title = encodeURIComponent(pattern.title);
    const message = encodeURIComponent(pattern.message);
    const date = pattern.date;
    const time = pattern.time;
    
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
      const obsidianLink = `obsidian://open?vault=${encodeURIComponent(this.app.vault.getName())}&file=${encodeURIComponent(pattern.filePath)}&line=${pattern.lineNumber}`;
      returnLink = `&returnLink=${encodeURIComponent(obsidianLink)}`;
    }
    
    return `notelert://add?title=${title}&message=${message}&date=${date}&time=${time}${locationParams}${returnLink}`;
  }

  // Crear identificador único para una notificación
  private createNotificationId(pattern: DetectedPattern): string {
    // Usar título, fecha, hora y contenido del mensaje para crear un ID único
    // No usar posición porque puede cambiar al editar el texto
    const contentHash = this.simpleHash(pattern.message);
    return `${pattern.title}|${pattern.date}|${pattern.time}|${contentHash}`;
  }

  // Función simple para crear hash del contenido
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convertir a 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // Verificar si una línea ya tiene un icono visual
  private hasVisualIndicator(line: string): boolean {
    // Lista de iconos comunes que podrían indicar que ya fue procesado
    const visualIndicators = [
      "⏰", "🕐", "🕑", "🕒", "🕓", "🕔", "🕕", "🕖", "🕗", "🕘", "🕙", "🕚", "🕛",
      "📅", "📆", "🗓️", "⏱️", "⏲️", "⏳", "⌚", "🔔", "✅", "✓", "✔️", "🎯"
    ];
    
    return visualIndicators.some(icon => line.includes(icon));
  }

  // Añadir icono visual al archivo
  private async addVisualIndicator(pattern: DetectedPattern) {
    try {
      if (!pattern.filePath || !pattern.lineNumber) return;

      const file = this.app.vault.getAbstractFileByPath(pattern.filePath);
      if (!file || !(file instanceof TFile)) return;

      const content = await this.app.vault.read(file);
      const lines = content.split('\n');
      
      // Verificar que la línea existe y no tiene ya un icono
      const lineIndex = pattern.lineNumber - 1;
      if (lineIndex >= 0 && lineIndex < lines.length) {
        const line = lines[lineIndex];
        
        // Solo añadir el icono si no lo tiene ya
        if (!this.hasVisualIndicator(line)) {
          // Añadir el icono al final de la línea
          lines[lineIndex] = line.trim() + ` ${this.settings.visualIndicatorIcon}`;
          
          // Escribir el contenido modificado
          await this.app.vault.modify(file, lines.join('\n'));
          this.log(`Icono añadido a la línea ${pattern.lineNumber} en ${file.name}`);
        }
      }
    } catch (error) {
      this.log(`Error añadiendo icono visual: ${error}`);
    }
  }

  // Limpiar historial de procesamiento - eliminado (ya no hay escaneo automático)

  // Función de logging
  public log(message: string) {
    if (this.settings.debugMode) {
      console.log(`[Notelert] ${message}`);
    }
  }
}

// Panel de configuración
class NotelertSettingTab extends PluginSettingTab {
  plugin: NotelertPlugin;

  constructor(app: App, plugin: NotelertPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    const currentLanguage = getLanguageByCode(this.plugin.settings.language) || getDefaultLanguage();

    containerEl.createEl("h2", { text: getTranslation(this.plugin.settings.language, "settings.title") });

    // Selector de idioma
    new Setting(containerEl)
      .setName(getTranslation(this.plugin.settings.language, "settings.language"))
      .setDesc(getTranslation(this.plugin.settings.language, "settings.languageDesc"))
      .addDropdown((dropdown) => {
        SUPPORTED_LANGUAGES.forEach(lang => {
          dropdown.addOption(lang.code, `${lang.nativeName} (${lang.name})`);
        });
        dropdown.setValue(this.plugin.settings.language);
        dropdown.onChange(async (value) => {
          this.plugin.settings.language = value;
          await this.plugin.saveSettings();
          // Recargar la configuración para actualizar las traducciones
          this.display();
        });
      });

    // Procesamiento automático
    new Setting(containerEl)
      .setName(getTranslation(this.plugin.settings.language, "settings.autoProcess"))
      .setDesc(getTranslation(this.plugin.settings.language, "settings.autoProcessDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.autoProcess)
          .onChange(async (value) => {
            this.plugin.settings.autoProcess = value;
            await this.plugin.saveSettings();
          })
      );

    // Procesar al guardar
    new Setting(containerEl)
      .setName(getTranslation(this.plugin.settings.language, "settings.processOnSave"))
      .setDesc(getTranslation(this.plugin.settings.language, "settings.processOnSaveDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.processOnSave)
          .onChange(async (value) => {
            this.plugin.settings.processOnSave = value;
            await this.plugin.saveSettings();
          })
      );

    // Procesar al abrir
    new Setting(containerEl)
      .setName(getTranslation(this.plugin.settings.language, "settings.processOnOpen"))
      .setDesc(getTranslation(this.plugin.settings.language, "settings.processOnOpenDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.processOnOpen)
          .onChange(async (value) => {
            this.plugin.settings.processOnOpen = value;
            await this.plugin.saveSettings();
          })
      );

    // Modo debug
    new Setting(containerEl)
      .setName(getTranslation(this.plugin.settings.language, "settings.debugMode"))
      .setDesc(getTranslation(this.plugin.settings.language, "settings.debugModeDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.debugMode)
          .onChange(async (value) => {
            this.plugin.settings.debugMode = value;
            await this.plugin.saveSettings();
          })
      );

    // Usar debounce
    new Setting(containerEl)
      .setName(getTranslation(this.plugin.settings.language, "settings.useDebounce"))
      .setDesc(getTranslation(this.plugin.settings.language, "settings.useDebounceDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.useDebounce)
          .onChange(async (value) => {
            this.plugin.settings.useDebounce = value;
            await this.plugin.saveSettings();
          })
      );

    // Tiempo de debounce
    new Setting(containerEl)
      .setName(getTranslation(this.plugin.settings.language, "settings.debounceDelay"))
      .setDesc(getTranslation(this.plugin.settings.language, "settings.debounceDelayDesc"))
      .addSlider((slider) =>
        slider
          .setLimits(1, 10, 1)
          .setValue(this.plugin.settings.debounceDelay / 1000)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.debounceDelay = value * 1000;
            await this.plugin.saveSettings();
          })
      );

    // Modal de confirmación
    new Setting(containerEl)
      .setName(getTranslation(this.plugin.settings.language, "settings.showConfirmationModal"))
      .setDesc(getTranslation(this.plugin.settings.language, "settings.showConfirmationModalDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showConfirmationModal)
          .onChange(async (value) => {
            this.plugin.settings.showConfirmationModal = value;
            await this.plugin.saveSettings();
          })
      );

    // Iconos visuales
    new Setting(containerEl)
      .setName(getTranslation(this.plugin.settings.language, "settings.addVisualIndicators"))
      .setDesc(getTranslation(this.plugin.settings.language, "settings.addVisualIndicatorsDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.addVisualIndicators)
          .onChange(async (value) => {
            this.plugin.settings.addVisualIndicators = value;
            await this.plugin.saveSettings();
          })
      );

    // Icono visual personalizado
    new Setting(containerEl)
      .setName(getTranslation(this.plugin.settings.language, "settings.visualIndicatorIcon"))
      .setDesc(getTranslation(this.plugin.settings.language, "settings.visualIndicatorIconDesc"))
      .addText((text) =>
        text
          .setPlaceholder("⏰")
          .setValue(this.plugin.settings.visualIndicatorIcon)
          .onChange(async (value) => {
            this.plugin.settings.visualIndicatorIcon = value || "⏰";
            await this.plugin.saveSettings();
          })
      );

    // Nuevo sistema de sintaxis
    new Setting(containerEl)
      .setName(getTranslation(this.plugin.settings.language, "settings.useNewSyntax"))
      .setDesc(getTranslation(this.plugin.settings.language, "settings.useNewSyntaxDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.useNewSyntax)
          .onChange(async (value) => {
            this.plugin.settings.useNewSyntax = value;
            await this.plugin.saveSettings();
          })
      );

    // Date picker
    new Setting(containerEl)
      .setName(getTranslation(this.plugin.settings.language, "settings.enableDatePicker"))
      .setDesc(getTranslation(this.plugin.settings.language, "settings.enableDatePickerDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.enableDatePicker)
          .onChange(async (value) => {
            this.plugin.settings.enableDatePicker = value;
            await this.plugin.saveSettings();
          })
      );

    // Carpetas excluidas
    new Setting(containerEl)
      .setName(getTranslation(this.plugin.settings.language, "settings.excludedFolders"))
      .setDesc(getTranslation(this.plugin.settings.language, "settings.excludedFoldersDesc"))
      .addTextArea((text) =>
        text
          .setPlaceholder("Templates, Archive, Trash")
          .setValue(this.plugin.settings.excludedFolders.join(", "))
          .onChange(async (value) => {
            this.plugin.settings.excludedFolders = value
              .split(",")
              .map((folder) => folder.trim())
              .filter((folder) => folder.length > 0);
            await this.plugin.saveSettings();
          })
      );

    // Patrones personalizados
    new Setting(containerEl)
      .setName(getTranslation(this.plugin.settings.language, "settings.customPatterns"))
      .setDesc(getTranslation(this.plugin.settings.language, "settings.customPatternsDesc"))
      .addTextArea((text) =>
        text
          .setPlaceholder(currentLanguage.keywords.join(", "))
          .setValue(this.plugin.settings.customPatterns.join(", "))
          .onChange(async (value) => {
            this.plugin.settings.customPatterns = value
              .split(",")
              .map((pattern) => pattern.trim())
              .filter((pattern) => pattern.length > 0);
            await this.plugin.saveSettings();
          })
      );

    // Información sobre patrones soportados
    containerEl.createEl("h3", { text: getTranslation(this.plugin.settings.language, "settings.supportedPatterns") });
    
    const patternsInfo = containerEl.createEl("div", { 
      cls: "notelert-patterns-info" 
    });
    
    // Generar información dinámica basada en el idioma seleccionado
    const keywordsList = currentLanguage.keywords.map(kw => `"${kw}"`).join(", ");
    const todayWords = currentLanguage.datePatterns.today.join(", ");
    const tomorrowWords = currentLanguage.datePatterns.tomorrow.join(", ");
    const yesterdayWords = currentLanguage.datePatterns.yesterday.join(", ");
    
    patternsInfo.innerHTML = `
      <p><strong>${getTranslation(this.plugin.settings.language, "settings.keywords")}:</strong></p>
      <ul>
        <li>${keywordsList}</li>
      </ul>
      
      <p><strong>${getTranslation(this.plugin.settings.language, "settings.dates")}</strong></p>
      <ul>
        <li>Fechas absolutas: 12/10, 15/10/2025, 12-10-2025</li>
        <li>Fechas relativas: ${todayWords}, ${tomorrowWords}, ${yesterdayWords}</li>
      </ul>
      
      <p><strong>${getTranslation(this.plugin.settings.language, "settings.times")}</strong></p>
      <ul>
        <li>Formato 24h: 15:30, 9:00, 18:45</li>
        <li>Formato con punto: 15.30, 9.00</li>
      </ul>
      
      <p><strong>${getTranslation(this.plugin.settings.language, "settings.examples")}</strong></p>
      <ul>
        <li>"${currentLanguage.keywords[0]} Reunión importante a las 15:30"</li>
        <li>"${currentLanguage.keywords[1]} Llamar al doctor ${currentLanguage.datePatterns.tomorrow[0]} a las 09:00"</li>
        <li>"${currentLanguage.keywords[2]} Comprar regalos el 12/10 a las 18:00"</li>
        <li>"${currentLanguage.keywords[3]} Cita médica el 15/10/2025 a las 14:30"</li>
      </ul>
    `;
  }
}
