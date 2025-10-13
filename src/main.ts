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
      
      // Añadir feedback visual: texto en azul y reemplazar :@ con icono de despertador
      this.addVisualFeedback(fullText, `:@${date}, ${time}`);
      
      this.plugin.log(`Notificación creada desde date picker: ${pattern.title}`);
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
  private processedNotifications: Map<string, Set<string>> = new Map();
  private debounceTimers: Map<string, number> = new Map();

  async onload() {
    console.log("Cargando plugin Notelert...");
    await this.loadSettings();

    // Comando para procesar la nota actual
    this.addCommand({
      id: "process-current-note",
      name: getTranslation(this.settings.language, "commands.processCurrentNote"),
      callback: () => this.processCurrentNote(),
    });

    // Comando para procesar todas las notas
    this.addCommand({
      id: "process-all-notes",
      name: getTranslation(this.settings.language, "commands.processAllNotes"),
      callback: () => this.processAllNotes(),
    });

    // Comando para limpiar historial de procesamiento
    this.addCommand({
      id: "clear-processed-history",
      name: getTranslation(this.settings.language, "commands.clearProcessedHistory"),
      callback: () => this.clearProcessedHistory(),
    });

    // Configuración del plugin
    this.addSettingTab(new NotelertSettingTab(this.app, this));

    // Eventos automáticos
    if (this.settings.processOnSave) {
      this.registerEvent(
        this.app.vault.on("modify", (file) => {
          if (file instanceof TFile && this.shouldProcessFile(file)) {
            this.scheduleFileProcessing(file);
          }
        })
      );
    }

    if (this.settings.processOnOpen) {
      this.registerEvent(
        this.app.workspace.on("file-open", (file) => {
          if (file instanceof TFile && this.shouldProcessFile(file)) {
            this.processFile(file);
          }
        })
      );
    }

    // Icono en la barra de herramientas
    this.addRibbonIcon("bell", "Procesar nota actual", () => {
      this.processCurrentNote();
    });

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
    
    // Limpiar todos los timers de debounce
    this.debounceTimers.forEach((timer) => {
      clearTimeout(timer);
    });
    this.debounceTimers.clear();
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  // Verificar si un archivo debe ser procesado
  private shouldProcessFile(file: TFile): boolean {
    if (!this.settings.autoProcess) return false;
    if (file.extension !== "md") return false;

    // Verificar si está en una carpeta excluida
    const folderPath = file.parent?.path || "";
    return !this.settings.excludedFolders.some((folder) =>
      folderPath.includes(folder)
    );
  }

  // Manejar cambios en el editor para detectar :@
  private handleEditorChange(editor: any, info: any) {
    if (!this.settings.enableDatePicker || !this.settings.useNewSyntax) return;
    
    const cursor = editor.getCursor();
    const line = editor.getLine(cursor.line);
    const beforeCursor = line.substring(0, cursor.ch);
    
    // Detectar si se acaba de escribir :@
    if (beforeCursor.endsWith(':@')) {
      this.log("Detectado :@ - abriendo date picker");
      this.openDatePicker(editor, cursor);
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

  // Programar el procesamiento de un archivo con debounce
  private scheduleFileProcessing(file: TFile) {
    const filePath = file.path;
    
    // Si no se usa debounce, procesar inmediatamente
    if (!this.settings.useDebounce) {
      this.processFile(file);
      return;
    }

    // Cancelar el timer anterior si existe
    const existingTimer = this.debounceTimers.get(filePath);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Crear un nuevo timer
    const timer = setTimeout(() => {
      this.log(`Procesando archivo después del debounce: ${file.name}`);
      this.processFile(file);
      this.debounceTimers.delete(filePath);
    }, this.settings.debounceDelay);

    this.debounceTimers.set(filePath, timer);
    this.log(`Programado procesamiento de ${file.name} en ${this.settings.debounceDelay}ms`);
  }

  // Procesar la nota actual
  private async processCurrentNote() {
    const activeFile = this.app.workspace.getActiveFile();
    if (activeFile && activeFile instanceof TFile) {
      await this.processFile(activeFile);
    } else {
      new Notice(getTranslation(this.settings.language, "notices.noActiveNote"));
    }
  }

  // Procesar todas las notas
  private async processAllNotes() {
    const markdownFiles = this.app.vault.getMarkdownFiles();
    let processedCount = 0;

    for (const file of markdownFiles) {
      if (this.shouldProcessFile(file)) {
        await this.processFile(file);
        processedCount++;
      }
    }

    new Notice(getTranslation(this.settings.language, "notices.processedNotes", { count: processedCount }));
  }

  // Procesar un archivo específico
  private async processFile(file: TFile) {
    try {
      const content = await this.app.vault.read(file);
      const patterns = this.detectPatterns(content, file.path);

      if (patterns.length > 0) {
        this.log(`Encontrados ${patterns.length} patrones en ${file.name}`);
        
        // Obtener notificaciones ya procesadas para este archivo
        const processedForFile = this.processedNotifications.get(file.path) || new Set<string>();
        let newNotificationsCount = 0;
        
        for (const pattern of patterns) {
          // Crear un identificador único para esta notificación
          const notificationId = this.createNotificationId(pattern);
          
          // Solo procesar si no se ha procesado antes
          if (!processedForFile.has(notificationId)) {
            if (this.settings.showConfirmationModal) {
              // Con modal: no marcar como procesado hasta confirmar
              await this.executeNotelertDeepLink(pattern);
            } else {
              // Sin modal: procesar directamente
              await this.executeNotelertDeepLink(pattern);
              processedForFile.add(notificationId);
              newNotificationsCount++;
            }
          }
        }

        // Actualizar el registro de notificaciones procesadas
        this.processedNotifications.set(file.path, processedForFile);
        
        if (newNotificationsCount > 0) {
          new Notice(getTranslation(this.settings.language, "notices.processedNote", { filename: file.name, count: newNotificationsCount }));
        }
      }
    } catch (error) {
      this.log(`Error procesando ${file.name}: ${error}`);
    }
  }

  // Detectar patrones de fecha/hora en el texto
  private detectPatterns(content: string, filePath: string): DetectedPattern[] {
    const patterns: DetectedPattern[] = [];
    const lines = content.split('\n');

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      
      // Verificar si la línea ya tiene un icono visual (ya fue procesada)
      if (this.settings.addVisualIndicators && this.hasVisualIndicator(line)) {
        this.log(`Línea ya procesada (tiene icono): ${line.trim()}`);
        continue;
      }

      // Detectar nuevo formato {@fecha, hora}
      if (this.settings.useNewSyntax) {
        const newSyntaxPatterns = this.extractNewSyntaxPatterns(line);
        for (const pattern of newSyntaxPatterns) {
          pattern.filePath = filePath;
          pattern.lineNumber = lineIndex + 1;
          patterns.push(pattern);
        }
      }

      // Detectar formato antiguo (solo si no se usa el nuevo sistema)
      if (!this.settings.useNewSyntax) {
        const currentLanguage = getLanguageByCode(this.settings.language) || getDefaultLanguage();
        
        // Verificar si la línea contiene palabras clave del idioma seleccionado
        const languageKeywords = currentLanguage.keywords;
        const customKeywords = this.settings.customPatterns;
        const allKeywords = [...languageKeywords, ...customKeywords];
        
        const hasKeyword = allKeywords.some(keyword => 
          line.toLowerCase().includes(keyword.toLowerCase())
        );

        if (!hasKeyword) continue;

        // Detectar fechas y horas
        const dateTimePatterns = this.extractDateTimePatterns(line);
        
        for (const dateTime of dateTimePatterns) {
          const pattern: DetectedPattern = {
            text: line.trim(),
            title: this.extractTitle(line),
            message: line.trim(),
            date: dateTime.date,
            time: dateTime.time,
            fullMatch: line.trim(),
            startIndex: 0,
            endIndex: line.length,
            filePath: filePath,
            lineNumber: lineIndex + 1, // Las líneas empiezan en 1
          };

          patterns.push(pattern);
        }
      }
    }

    return patterns;
  }

  // Extraer patrones del nuevo formato :@fecha, hora
  private extractNewSyntaxPatterns(text: string): DetectedPattern[] {
    const patterns: DetectedPattern[] = [];
    
    // Patrón para :@fecha, hora
    const newSyntaxRegex = /:@([^,\s]+),\s*([^\s]+)/g;
    let match;
    
    while ((match = newSyntaxRegex.exec(text)) !== null) {
      const dateStr = match[1].trim();
      const timeStr = match[2].trim();
      
      // Parsear fecha y hora
      const date = this.parseNewSyntaxDate(dateStr);
      const time = this.parseNewSyntaxTime(timeStr);
      
      if (date && time) {
        const pattern: DetectedPattern = {
          text: text.trim(),
          title: this.extractTitleFromNewSyntax(text, match[0]),
          message: text.trim(),
          date: date,
          time: time,
          fullMatch: match[0],
          startIndex: match.index,
          endIndex: match.index + match[0].length,
        };
        
        patterns.push(pattern);
      }
    }
    
    return patterns;
  }

  // Parsear fecha del nuevo formato
  private parseNewSyntaxDate(dateStr: string): string | null {
    // Formato YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }
    
    // Formato DD/MM/YYYY o DD/MM/YY
    const dateMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
    if (dateMatch) {
      let day = parseInt(dateMatch[1]);
      let month = parseInt(dateMatch[2]);
      let year = parseInt(dateMatch[3]);
      
      if (year < 100) {
        year += year < 50 ? 2000 : 1900;
      }
      
      return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    }
    
    // Fechas relativas - buscar en todos los idiomas soportados
    const today = new Date();
    const lowerDateStr = dateStr.toLowerCase();
    
    // Buscar en todos los idiomas soportados
    for (const lang of SUPPORTED_LANGUAGES) {
      if (lang.datePatterns.today.some(pattern => pattern.toLowerCase() === lowerDateStr)) {
        return today.toISOString().split('T')[0];
      }
      
      if (lang.datePatterns.tomorrow.some(pattern => pattern.toLowerCase() === lowerDateStr)) {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
      }
      
      if (lang.datePatterns.yesterday.some(pattern => pattern.toLowerCase() === lowerDateStr)) {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday.toISOString().split('T')[0];
      }
    }
    
    return null;
  }

  // Parsear hora del nuevo formato
  private parseNewSyntaxTime(timeStr: string): string | null {
    // Formato HH:MM
    if (/^\d{1,2}:\d{2}$/.test(timeStr)) {
      const [hours, minutes] = timeStr.split(':').map(Number);
      if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      }
    }
    
    return null;
  }

  // Extraer título del nuevo formato
  private extractTitleFromNewSyntax(text: string, match: string): string {
    // Remover el patrón {@fecha, hora} del texto
    let title = text.replace(match, '').trim();
    
    // Limpiar espacios extra
    title = title.replace(/\s+/g, ' ').trim();
    
    // Limitar longitud
    if (title.length > 50) {
      title = title.substring(0, 47) + '...';
    }
    
    return title || 'Recordatorio';
  }

  // Extraer patrones de fecha y hora
  private extractDateTimePatterns(text: string): { date: string; time: string }[] {
    const patterns: { date: string; time: string }[] = [];
    const currentLanguage = getLanguageByCode(this.settings.language) || getDefaultLanguage();
    
    // Patrones de fecha
    const datePatterns = [
      // Fechas absolutas: DD/MM/YYYY, DD/MM/YY, DD-MM-YYYY, etc.
      /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/g,
      // Fechas relativas del idioma seleccionado
      new RegExp(`\\b(${currentLanguage.datePatterns.today.join('|')}|${currentLanguage.datePatterns.tomorrow.join('|')}|${currentLanguage.datePatterns.yesterday.join('|')})\\b`, 'gi'),
    ];

    // Patrones de hora
    const timePatterns = [
      // HH:MM, H:MM
      /(\d{1,2}):(\d{2})/g,
      // HH.MM, H.MM
      /(\d{1,2})\.(\d{2})/g,
    ];

    // Primero, buscar fechas y sus horas asociadas
    for (const datePattern of datePatterns) {
      let dateMatch;
      while ((dateMatch = datePattern.exec(text)) !== null) {
        // Buscar horas en la misma línea
        const timePattern = timePatterns[0];
        let timeMatch;
        const timeMatches: RegExpExecArray[] = [];
        
        // Reset regex
        timePattern.lastIndex = 0;
        while ((timeMatch = timePattern.exec(text)) !== null) {
          timeMatches.push(timeMatch);
        }
        
        if (timeMatches.length > 0) {
          for (const timeMatch of timeMatches) {
            const date = this.parseDate(dateMatch[0]);
            const time = this.parseTime(timeMatch[0]);
            
            if (date && time) {
              patterns.push({ date, time });
            }
          }
        } else {
          // Solo fecha, usar hora por defecto
          const date = this.parseDate(dateMatch[0]);
          if (date) {
            patterns.push({ date, time: "09:00" });
          }
        }
      }
    }

    // Buscar horas que no están asociadas a fechas explícitas
    // pero que pueden estar cerca de fechas relativas
    const timePattern = timePatterns[0];
    let timeMatch;
    timePattern.lastIndex = 0;
    
    while ((timeMatch = timePattern.exec(text)) !== null) {
      const time = this.parseTime(timeMatch[0]);
      if (time) {
        // Verificar si ya se procesó esta hora con una fecha
        const alreadyProcessed = patterns.some(p => p.time === time);
        if (!alreadyProcessed) {
          // Buscar fechas relativas cerca de esta hora
          const timeIndex = timeMatch.index;
          const contextStart = Math.max(0, timeIndex - 50);
          const contextEnd = Math.min(text.length, timeIndex + 50);
          const context = text.substring(contextStart, contextEnd).toLowerCase();
          
          let dateForTime: string | null = null;
          
          // Buscar fechas relativas en el contexto
          if (currentLanguage.datePatterns.tomorrow.some(pattern => 
            new RegExp(pattern, 'i').test(context)
          )) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            dateForTime = tomorrow.toISOString().split('T')[0];
          } else if (currentLanguage.datePatterns.yesterday.some(pattern => 
            new RegExp(pattern, 'i').test(context)
          )) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            dateForTime = yesterday.toISOString().split('T')[0];
          } else if (currentLanguage.datePatterns.today.some(pattern => 
            new RegExp(pattern, 'i').test(context)
          )) {
            const today = new Date();
            dateForTime = today.toISOString().split('T')[0];
          } else {
            // Si no hay fecha relativa, asumir hoy
            const today = new Date();
            dateForTime = today.toISOString().split('T')[0];
          }
          
          if (dateForTime) {
            patterns.push({ date: dateForTime, time });
          }
        }
      }
    }

    return patterns;
  }

  // Parsear fecha
  private parseDate(dateStr: string): string | null {
    const today = new Date();
    const currentLanguage = getLanguageByCode(this.settings.language) || getDefaultLanguage();
    
    // Fechas relativas del idioma seleccionado
    if (currentLanguage.datePatterns.today.some(pattern => 
      new RegExp(pattern, 'i').test(dateStr)
    )) {
      return today.toISOString().split('T')[0];
    }
    
    if (currentLanguage.datePatterns.tomorrow.some(pattern => 
      new RegExp(pattern, 'i').test(dateStr)
    )) {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    }
    
    if (currentLanguage.datePatterns.yesterday.some(pattern => 
      new RegExp(pattern, 'i').test(dateStr)
    )) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return yesterday.toISOString().split('T')[0];
    }

    // Fechas absolutas
    const dateMatch = dateStr.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
    if (dateMatch) {
      let day = parseInt(dateMatch[1]);
      let month = parseInt(dateMatch[2]);
      let year = parseInt(dateMatch[3]);

      // Ajustar año si es de 2 dígitos
      if (year < 100) {
        year += year < 50 ? 2000 : 1900;
      }

      // Crear fecha (mes - 1 porque Date usa 0-indexado)
      const date = new Date(year, month - 1, day);
      
      // Verificar que la fecha es válida
      if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
        return date.toISOString().split('T')[0];
      }
    }

    return null;
  }

  // Parsear hora
  private parseTime(timeStr: string): string | null {
    const timeMatch = timeStr.match(/(\d{1,2})[:\.](\d{2})/);
    if (timeMatch) {
      const hours = parseInt(timeMatch[1]);
      const minutes = parseInt(timeMatch[2]);
      
      if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      }
    }
    
    return null;
  }

  // Extraer título del texto
  private extractTitle(text: string): string {
    const currentLanguage = getLanguageByCode(this.settings.language) || getDefaultLanguage();
    
    // Remover palabras clave del idioma seleccionado
    let title = text;
    const allKeywords = [...currentLanguage.keywords, ...this.settings.customPatterns];
    for (const keyword of allKeywords) {
      title = title.replace(new RegExp(keyword, 'gi'), '').trim();
    }
    
    // Remover fechas y horas
    title = title.replace(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/g, '');
    title = title.replace(/\d{1,2}[:\.]\d{2}/g, '');
    
    // Remover fechas relativas del idioma seleccionado
    const relativeDates = [
      ...currentLanguage.datePatterns.today,
      ...currentLanguage.datePatterns.tomorrow,
      ...currentLanguage.datePatterns.yesterday
    ];
    for (const datePattern of relativeDates) {
      title = title.replace(new RegExp(`\\b${datePattern}\\b`, 'gi'), '');
    }
    
    // Limpiar espacios extra
    title = title.replace(/\s+/g, ' ').trim();
    
    // Limitar longitud
    if (title.length > 50) {
      title = title.substring(0, 47) + '...';
    }
    
    return title || getTranslation(this.settings.language, 'notices.defaultTitle');
  }

  // Ejecutar deeplink de Notelert
  private async executeNotelertDeepLink(pattern: DetectedPattern) {
    // Si está activado el modal de confirmación, mostrarlo
    if (this.settings.showConfirmationModal) {
      new NotelertConfirmationModal(
        this.app,
        pattern,
        this.settings.language,
        (confirmedPattern) => this.createNotificationAndMarkProcessed(confirmedPattern),
        () => this.log(`Notificación cancelada: ${pattern.title}`)
      ).open();
    } else {
      // Crear notificación directamente
      this.createNotification(pattern);
    }
  }

  // Crear la notificación (función separada para reutilizar)
  private async createNotification(pattern: DetectedPattern) {
    try {
      const deeplink = this.generateDeepLink(pattern);
      this.log(`Ejecutando deeplink: ${deeplink}`);
      
      // En un entorno de escritorio, intentar abrir el deeplink
      if (typeof window !== 'undefined' && window.open) {
        window.open(deeplink, '_self');
      }
      
      // También intentar con location.href como fallback
      if (typeof window !== 'undefined') {
        window.location.href = deeplink;
      }

      // Añadir icono visual al archivo si está habilitado
      if (this.settings.addVisualIndicators && pattern.filePath) {
        await this.addVisualIndicator(pattern);
      }
      
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
      
      // Marcar como procesada
      if (pattern.filePath) {
        const processedForFile = this.processedNotifications.get(pattern.filePath) || new Set<string>();
        const notificationId = this.createNotificationId(pattern);
        processedForFile.add(notificationId);
        this.processedNotifications.set(pattern.filePath, processedForFile);
        
        // Mostrar notificación de éxito
        new Notice(getTranslation(this.settings.language, "notices.processedNote", { 
          filename: pattern.filePath.split('/').pop() || 'archivo', 
          count: 1 
        }));
      }
    } catch (error) {
      this.log(`Error procesando notificación confirmada: ${error}`);
      new Notice(getTranslation(this.settings.language, "notices.errorCreatingNotification", { title: pattern.title }));
    }
  }

  // Generar deeplink para Notelert
  private generateDeepLink(pattern: DetectedPattern): string {
    const title = encodeURIComponent(pattern.title);
    const message = encodeURIComponent(pattern.message);
    const date = pattern.date;
    const time = pattern.time;
    
    // Crear deep link de vuelta a Obsidian si tenemos información del archivo
    let returnLink = '';
    if (pattern.filePath && pattern.lineNumber) {
      const obsidianLink = `obsidian://open?vault=${encodeURIComponent(this.app.vault.getName())}&file=${encodeURIComponent(pattern.filePath)}&line=${pattern.lineNumber}`;
      returnLink = `&returnLink=${encodeURIComponent(obsidianLink)}`;
    }
    
    return `notelert://add?title=${title}&message=${message}&date=${date}&time=${time}${returnLink}`;
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

  // Limpiar historial de procesamiento
  private clearProcessedHistory() {
    this.processedNotifications.clear();
    new Notice(getTranslation(this.settings.language, "notices.clearedHistory"));
  }

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