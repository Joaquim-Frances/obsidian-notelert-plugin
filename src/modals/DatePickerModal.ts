import { App, Editor, EditorPosition, Modal, Notice, Platform } from "obsidian";
import { DetectedPattern, SavedLocation } from "../core/types";
import { getTranslation } from "../i18n";
import { INotelertPlugin } from "../core/plugin-interface";

export class NotelertDatePickerModal extends Modal {
  private onCancel: () => void;
  private language: string;
  private plugin: INotelertPlugin;
  private editor: Editor;
  private cursor: EditorPosition;
  private originalText: string;
  private notificationType: 'time' | 'location' = 'time'; // Tipo de notificación
  private selectedLocation: SavedLocation | null = null; // Ubicación seleccionada

  constructor(app: App, plugin: INotelertPlugin, language: string, editor: Editor, cursor: EditorPosition, originalText: string, onCancel: () => void) {
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

    const isDesktop = !Platform.isMobile;

    // Estilos responsive para el modal - optimizado para desktop
    contentEl.setAttribute("style", `
      min-width: ${isDesktop ? '400px' : '300px'}; 
      max-width: ${isDesktop ? '500px' : '600px'}; 
      width: ${isDesktop ? 'auto' : '95vw'};
      max-height: ${isDesktop ? 'auto' : '90vh'}; 
      overflow: hidden;
      padding: ${isDesktop ? '25px' : '20px'};
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      margin: 0 auto;
    `);

    // Contenedor con scroll interno (solo si es necesario en móvil)
    const scrollContainer = contentEl.createEl("div", {
      attr: {
        style: `
          flex: 1;
          overflow-y: ${isDesktop ? 'visible' : 'auto'};
          overflow-x: hidden;
          padding-right: ${isDesktop ? '0' : '5px'};
          margin-bottom: 10px;
        `
      }
    });

    scrollContainer.createEl("h2", {
      text: getTranslation(this.language, "datePicker.title"),
      attr: { style: "margin: 0 0 15px 0; font-size: 18px; font-weight: 600;" }
    });

    // Contenedor principal - usar todo el ancho
    const container = scrollContainer.createEl("div", { cls: "notelert-datepicker-container" });
    container.setAttribute("style", "margin: 0; width: 100%;");

    // En desktop, forzar tipo 'time' (no hay ubicaciones)
    if (isDesktop) {
      this.notificationType = 'time';
    }

    // Selector de fecha
    const dateContainer = container.createEl("div", { cls: "notelert-date-container" });
    dateContainer.setAttribute("style", "margin-bottom: 15px;");

    const dateLabel = dateContainer.createEl("label", { text: getTranslation(this.language, "datePicker.dateLabel") });
    dateLabel.setAttribute("style", "display: block; margin-bottom: 5px; font-weight: 500;");

    const dateInput = dateContainer.createEl("input", {
      type: "date",
      cls: "notelert-date-input"
    });
    dateInput.setAttribute("style", "width: 100%; padding: 10px; border: 1px solid var(--background-modifier-border); border-radius: 6px; box-sizing: border-box; font-size: 14px;");

    // Selector de hora - visual con botones +/- (mejor UX)
    const timeContainer = container.createEl("div", { cls: "notelert-time-container" });
    timeContainer.setAttribute("style", "margin-bottom: 20px;");

    const timeLabel = timeContainer.createEl("label", { text: getTranslation(this.language, "datePicker.timeLabel") });
    timeLabel.setAttribute("style", "display: block; margin-bottom: 10px; font-weight: 500;");

    // Contenedor para el selector visual de hora
    const timePickerContainer = timeContainer.createEl("div", {
      attr: {
        style: `
          display: flex;
          align-items: center;
          justify-content: center;
          gap: ${isDesktop ? '20px' : '15px'};
          padding: ${isDesktop ? '20px' : '15px'};
          background: var(--background-secondary);
          border-radius: 8px;
          border: 1px solid var(--background-modifier-border);
        `
      }
    });

    // Selector de horas
    const hoursContainer = timePickerContainer.createEl("div", {
      attr: {
        style: `
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        `
      }
    });

    hoursContainer.createEl("div", {
      text: getTranslation(this.language, "datePicker.hours"),
      attr: { style: "font-size: 11px; color: var(--text-muted); text-transform: uppercase; font-weight: 500; letter-spacing: 0.5px;" }
    });

    const hoursDisplay = hoursContainer.createEl("div", {
      text: "12",
      attr: {
        style: `
          font-size: ${isDesktop ? '32px' : '28px'};
          font-weight: 600;
          color: var(--text-normal);
          min-width: ${isDesktop ? '60px' : '50px'};
          text-align: center;
          padding: ${isDesktop ? '10px 15px' : '8px 12px'};
          background: var(--background-primary);
          border-radius: 6px;
          border: 2px solid var(--interactive-accent);
        `
      }
    });
    hoursDisplay.id = "hours-display";

    const hoursButtons = hoursContainer.createEl("div", {
      attr: {
        style: `
          display: flex;
          gap: 8px;
          align-items: center;
        `
      }
    });

    const hoursDecreaseBtn = hoursButtons.createEl("button", {
      text: "−",
      attr: {
        style: `
          width: ${isDesktop ? '36px' : '32px'};
          height: ${isDesktop ? '36px' : '32px'};
          border-radius: 6px;
          border: 1px solid var(--background-modifier-border);
          background: var(--background-primary);
          font-size: ${isDesktop ? '20px' : '18px'};
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        `
      }
    });
    hoursDecreaseBtn.addEventListener("mouseenter", () => {
      hoursDecreaseBtn.style.background = "var(--background-modifier-hover)";
      hoursDecreaseBtn.style.borderColor = "var(--interactive-accent)";
    });
    hoursDecreaseBtn.addEventListener("mouseleave", () => {
      hoursDecreaseBtn.style.background = "var(--background-primary)";
      hoursDecreaseBtn.style.borderColor = "var(--background-modifier-border)";
    });

    const hoursIncreaseBtn = hoursButtons.createEl("button", {
      text: "+",
      attr: {
        style: `
          width: ${isDesktop ? '36px' : '32px'};
          height: ${isDesktop ? '36px' : '32px'};
          border-radius: 6px;
          border: 1px solid var(--background-modifier-border);
          background: var(--background-primary);
          font-size: ${isDesktop ? '20px' : '18px'};
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        `
      }
    });
    hoursIncreaseBtn.addEventListener("mouseenter", () => {
      hoursIncreaseBtn.style.background = "var(--background-modifier-hover)";
      hoursIncreaseBtn.style.borderColor = "var(--interactive-accent)";
    });
    hoursIncreaseBtn.addEventListener("mouseleave", () => {
      hoursIncreaseBtn.style.background = "var(--background-primary)";
      hoursIncreaseBtn.style.borderColor = "var(--background-modifier-border)";
    });

    // Separador
    timePickerContainer.createEl("div", {
      text: ":",
      attr: {
        style: `
          font-size: ${isDesktop ? '32px' : '28px'};
          font-weight: 600;
          color: var(--text-normal);
          margin: 0 ${isDesktop ? '10px' : '5px'};
        `
      }
    });

    // Selector de minutos
    const minutesContainer = timePickerContainer.createEl("div", {
      attr: {
        style: `
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        `
      }
    });

    minutesContainer.createEl("div", {
      text: getTranslation(this.language, "datePicker.minutes"),
      attr: { style: "font-size: 11px; color: var(--text-muted); text-transform: uppercase; font-weight: 500; letter-spacing: 0.5px;" }
    });

    const minutesDisplay = minutesContainer.createEl("div", {
      text: "00",
      attr: {
        style: `
          font-size: ${isDesktop ? '32px' : '28px'};
          font-weight: 600;
          color: var(--text-normal);
          min-width: ${isDesktop ? '60px' : '50px'};
          text-align: center;
          padding: ${isDesktop ? '10px 15px' : '8px 12px'};
          background: var(--background-primary);
          border-radius: 6px;
          border: 2px solid var(--interactive-accent);
        `
      }
    });
    minutesDisplay.id = "minutes-display";

    const minutesButtons = minutesContainer.createEl("div", {
      attr: {
        style: `
          display: flex;
          gap: 8px;
          align-items: center;
        `
      }
    });

    const minutesDecreaseBtn = minutesButtons.createEl("button", {
      text: "−",
      attr: {
        style: `
          width: ${isDesktop ? '36px' : '32px'};
          height: ${isDesktop ? '36px' : '32px'};
          border-radius: 6px;
          border: 1px solid var(--background-modifier-border);
          background: var(--background-primary);
          font-size: ${isDesktop ? '20px' : '18px'};
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        `
      }
    });
    minutesDecreaseBtn.addEventListener("mouseenter", () => {
      minutesDecreaseBtn.style.background = "var(--background-modifier-hover)";
      minutesDecreaseBtn.style.borderColor = "var(--interactive-accent)";
    });
    minutesDecreaseBtn.addEventListener("mouseleave", () => {
      minutesDecreaseBtn.style.background = "var(--background-primary)";
      minutesDecreaseBtn.style.borderColor = "var(--background-modifier-border)";
    });

    const minutesIncreaseBtn = minutesButtons.createEl("button", {
      text: "+",
      attr: {
        style: `
          width: ${isDesktop ? '36px' : '32px'};
          height: ${isDesktop ? '36px' : '32px'};
          border-radius: 6px;
          border: 1px solid var(--background-modifier-border);
          background: var(--background-primary);
          font-size: ${isDesktop ? '20px' : '18px'};
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        `
      }
    });
    minutesIncreaseBtn.addEventListener("mouseenter", () => {
      minutesIncreaseBtn.style.background = "var(--background-modifier-hover)";
      minutesIncreaseBtn.style.borderColor = "var(--interactive-accent)";
    });
    minutesIncreaseBtn.addEventListener("mouseleave", () => {
      minutesIncreaseBtn.style.background = "var(--background-primary)";
      minutesIncreaseBtn.style.borderColor = "var(--background-modifier-border)";
    });

    // Input oculto para mantener compatibilidad
    const timeInput = timeContainer.createEl("input", {
      type: "time",
      cls: "notelert-time-input"
    });
    timeInput.setAttribute("style", "display: none;");
    timeInput.id = "hidden-time-input";

    // Botones rápidos de hora (solo en desktop)
    if (isDesktop) {
      const quickTimeButtons = timeContainer.createEl("div", {
        attr: {
          style: `
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            margin-top: 15px;
            justify-content: center;
          `
        }
      });

      const quickTimes = [
        { label: "9:00", hours: 9, minutes: 0 },
        { label: "12:00", hours: 12, minutes: 0 },
        { label: "15:00", hours: 15, minutes: 0 },
        { label: "18:00", hours: 18, minutes: 0 },
        { label: "21:00", hours: 21, minutes: 0 },
      ];

      quickTimes.forEach(qt => {
        const btn = quickTimeButtons.createEl("button", {
          text: qt.label,
          attr: {
            style: `
              padding: 6px 12px;
              font-size: 12px;
              border-radius: 4px;
              border: 1px solid var(--background-modifier-border);
              background: var(--background-primary);
              cursor: pointer;
              transition: all 0.2s;
            `
          }
        });
        btn.addEventListener("click", () => {
          this.updateTimeDisplay(qt.hours, qt.minutes, hoursDisplay, minutesDisplay, timeInput);
        });
        btn.addEventListener("mouseenter", () => {
          btn.style.background = "var(--background-modifier-hover)";
          btn.style.borderColor = "var(--interactive-accent)";
        });
        btn.addEventListener("mouseleave", () => {
          btn.style.background = "var(--background-primary)";
          btn.style.borderColor = "var(--background-modifier-border)";
        });
      });
    }

    // Funciones para actualizar hora/minutos
    const updateHours = (delta: number) => {
      const currentHours = parseInt(hoursDisplay.textContent || "12");
      const currentMinutes = parseInt(minutesDisplay.textContent || "0");
      let newHours = currentHours + delta;
      if (newHours < 0) newHours = 23;
      if (newHours > 23) newHours = 0;
      this.updateTimeDisplay(newHours, currentMinutes, hoursDisplay, minutesDisplay, timeInput);
    };

    const updateMinutes = (delta: number) => {
      const currentHours = parseInt(hoursDisplay.textContent || "12");
      const currentMinutes = parseInt(minutesDisplay.textContent || "0");
      let newMinutes = currentMinutes + delta;
      let newHours = currentHours;

      if (newMinutes < 0) {
        newMinutes = 59;
        newHours = newHours - 1;
        if (newHours < 0) newHours = 23;
      } else if (newMinutes > 59) {
        newMinutes = 0;
        newHours = newHours + 1;
        if (newHours > 23) newHours = 0;
      }

      this.updateTimeDisplay(newHours, newMinutes, hoursDisplay, minutesDisplay, timeInput);
    };

    hoursDecreaseBtn.addEventListener("click", () => updateHours(-1));
    hoursIncreaseBtn.addEventListener("click", () => updateHours(1));
    minutesDecreaseBtn.addEventListener("click", () => updateMinutes(-5)); // Incrementos de 5 minutos
    minutesIncreaseBtn.addEventListener("click", () => updateMinutes(5));

    // Inicializar con hora actual + 1 hora
    const now = new Date();
    now.setHours(now.getHours() + 1);
    const initialHours = now.getHours();
    const initialMinutes = Math.ceil(now.getMinutes() / 5) * 5; // Redondear a múltiplos de 5
    this.updateTimeDisplay(initialHours, initialMinutes, hoursDisplay, minutesDisplay, timeInput);

    // Selector de tipo de notificación (solo en móvil)
    const typeContainer = container.createEl("div", { cls: "notelert-type-container" });
    typeContainer.setAttribute("style", `margin-bottom: 20px; padding: 15px; background: var(--background-secondary); border-radius: 6px; width: 100%; box-sizing: border-box; ${isDesktop ? 'display: none;' : ''}`);

    const typeLabel = typeContainer.createEl("label", {
      text: getTranslation(this.language, "datePicker.notificationType"),
      attr: { style: "display: block; margin-bottom: 8px; font-weight: 500; font-size: 14px;" }
    });

    const typeButtonsContainer = typeContainer.createEl("div");
    typeButtonsContainer.setAttribute("style", "display: flex; gap: 10px; flex-wrap: wrap; width: 100%;");

    const timeButton = typeButtonsContainer.createEl("button", {
      text: "⏰ " + getTranslation(this.language, "datePicker.timeNotification"),
      cls: "mod-cta"
    });
    timeButton.setAttribute("style", "flex: 1; min-width: 120px; padding: 10px; font-size: 14px; white-space: nowrap;");
    timeButton.id = "notification-type-time";

    const locationButton = typeButtonsContainer.createEl("button", {
      text: "📍 " + getTranslation(this.language, "datePicker.locationNotification"),
      cls: "mod-secondary"
    });
    locationButton.setAttribute("style", "flex: 1; min-width: 120px; padding: 10px; font-size: 14px; white-space: nowrap;");
    locationButton.id = "notification-type-location";

    // Actualizar estilos según el tipo seleccionado
    const updateTypeButtons = () => {
      if (this.notificationType === 'time') {
        timeButton.className = "mod-cta";
        locationButton.className = "mod-secondary";
      } else {
        timeButton.className = "mod-secondary";
        locationButton.className = "mod-cta";
      }
    };

    timeButton.addEventListener("click", () => {
      this.notificationType = 'time';
      this.selectedLocation = null; // Reset selección
      updateTypeButtons();
      this.updateModalContent(container, dateInput, timeInput);
    });

    locationButton.addEventListener("click", () => {
      this.notificationType = 'location';
      this.selectedLocation = null; // Reset selección
      updateTypeButtons();
      this.updateModalContent(container, dateInput, timeInput);
    });

    updateTypeButtons();

    // Botones de acción rápida (solo para tipo 'time')
    const quickActions = container.createEl("div", { cls: "notelert-quick-actions" });
    quickActions.setAttribute("style", "margin-bottom: 20px; width: 100%; box-sizing: border-box;");
    quickActions.id = "quick-actions-container";

    const quickActionsTitle = quickActions.createEl("p", { text: getTranslation(this.language, "datePicker.quickActions") });
    quickActionsTitle.setAttribute("style", "margin-bottom: 10px; font-weight: 500;");

    const quickButtonsContainer = quickActions.createEl("div");
    quickButtonsContainer.setAttribute("style", "display: flex; gap: 8px; flex-wrap: wrap; width: 100%;");

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
        // Actualizar display visual si existe
        const hoursDisplay = document.getElementById("hours-display");
        const minutesDisplay = document.getElementById("minutes-display");
        if (hoursDisplay && minutesDisplay) {
          const [hours, minutes] = action.time.split(':').map(Number);
          this.updateTimeDisplay(hours, minutes, hoursDisplay, minutesDisplay, timeInput);
        }
      });
    });

    // Botones principales (fuera del scroll, siempre visibles)
    const buttonContainer = contentEl.createEl("div", { cls: "notelert-datepicker-buttons" });
    buttonContainer.setAttribute("style", `
      display: flex; 
      gap: 10px; 
      justify-content: flex-end; 
      margin-top: 10px; 
      flex-wrap: wrap;
      flex-shrink: 0;
      padding-top: 10px;
      border-top: 1px solid var(--background-modifier-border);
      width: 100%;
      box-sizing: border-box;
    `);

    const cancelButton = buttonContainer.createEl("button", {
      text: getTranslation(this.language, "datePicker.cancelButton"),
      cls: "mod-secondary"
    });
    cancelButton.setAttribute("style", "flex: 1; min-width: 120px; padding: 12px 20px; font-size: 14px; box-sizing: border-box;");
    cancelButton.addEventListener("click", () => {
      this.onCancel();
      this.close();
    });

    const confirmButton = buttonContainer.createEl("button", {
      text: getTranslation(this.language, "datePicker.confirmButton"),
      cls: "mod-cta"
    });
    confirmButton.setAttribute("style", "flex: 1; min-width: 120px; padding: 12px 20px; font-size: 14px; box-sizing: border-box;");
    confirmButton.id = "datepicker-confirm-button";

    confirmButton.addEventListener("click", async () => {
      // Mostrar spinner y deshabilitar botón
      this.showLoadingState(confirmButton);
      const addLog = (message: string) => {
        const debugInfo = document.getElementById("datepicker-debug-info");
        if (debugInfo) {
          const timestamp = new Date().toLocaleTimeString();
          const existing = debugInfo.innerHTML || '';
          const color = message.includes('❌') || message.includes('Error') ? 'var(--text-error)' :
            message.includes('✅') ? 'var(--text-success)' : 'var(--text-normal)';
          debugInfo.innerHTML = `${existing}<div style="margin: 4px 0; padding: 4px 8px; font-size: 11px; color: ${color}; border-left: 3px solid ${color}; background: var(--background-secondary); border-radius: 3px; word-wrap: break-word; white-space: pre-wrap;"><span style="opacity: 0.7;">[${timestamp}]</span> ${message}</div>`;
          const container = document.getElementById("datepicker-debug-container");
          if (container) {
            container.scrollTop = container.scrollHeight;
          }
        }
      };

      try {
        if (this.notificationType === 'location') {
          // Para ubicación, verificar que se haya seleccionado una
          if (!this.selectedLocation) {
            this.hideLoadingState(confirmButton);
            new Notice(getTranslation(this.language, "datePicker.selectSavedLocation") || "Por favor, selecciona una ubicación");
            return;
          }
          // Crear notificación con la ubicación seleccionada
          const success = await this.createNotificationFromLocation(this.selectedLocation);
          this.hideLoadingState(confirmButton);
          if (success) {
            this.close();
          }
        } else {
          // Para tiempo, usar fecha y hora
          const date = dateInput.value;
          const time = timeInput.value;

          if (date && time) {
            // Reemplazar :@ o :# con :@fecha, hora
            const replacement = `:@${date}, ${time}`;
            const line = this.editor.getLine(this.cursor.line);
            const beforeCursor = line.substring(0, this.cursor.ch - 2); // Quitar :@ o :#
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
            const success = await this.createNotificationFromDatePicker(date, time, newLine);

            this.hideLoadingState(confirmButton);
            if (success) {
              this.close();
            }
          } else {
            this.hideLoadingState(confirmButton);
            new Notice(getTranslation(this.language, "datePicker.selectDateTime"));
          }
        }
      } catch (error) {
        // Restaurar estado del botón en caso de error
        this.hideLoadingState(confirmButton);
        this.plugin.log(`Error en confirmación: ${error}`);
        new Notice(`❌ Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
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

  // Actualizar display visual de hora y sincronizar con input oculto
  private updateTimeDisplay(hours: number, minutes: number, hoursDisplay: HTMLElement, minutesDisplay: HTMLElement, timeInput: HTMLInputElement) {
    // Asegurar valores válidos
    if (hours < 0) hours = 0;
    if (hours > 23) hours = 23;
    if (minutes < 0) minutes = 0;
    if (minutes > 59) minutes = 59;

    // Actualizar displays
    hoursDisplay.textContent = String(hours).padStart(2, '0');
    minutesDisplay.textContent = String(minutes).padStart(2, '0');

    // Sincronizar con input oculto (formato HH:MM)
    const timeString = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    timeInput.value = timeString;
  }

  // Crear notificación directamente desde el date picker
  // Retorna true si fue exitoso, false si hubo error
  private async createNotificationFromDatePicker(date: string, time: string, fullText: string): Promise<boolean> {
    try {
      // Obtener el título de la nota (nombre del archivo sin extensión)
      const activeFile = this.plugin.app.workspace.getActiveFile();
      const noteTitle = activeFile ? activeFile.basename : 'Nota';

      // Obtener la línea actual y limpiarla de los patrones :@fecha, hora
      const currentLine = this.editor.getLine(this.cursor.line);
      const cleanMessage = currentLine.replace(/:@[^,\s]+,\s*[^\s]+/g, '').trim();

      // Crear el patrón detectado
      const pattern: DetectedPattern = {
        text: fullText.trim(),
        title: noteTitle,
        message: cleanMessage,
        date: date,
        time: time,
        fullMatch: `:@${date}, ${time}`,
        startIndex: 0,
        endIndex: fullText.length,
        filePath: activeFile?.path,
        lineNumber: this.cursor.line + 1,
        type: 'time'
      };

      // Crear la notificación directamente
      await this.plugin.createNotificationAndMarkProcessed(pattern);

      // Success is void, so we assume success if no error was thrown

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
      return true;
    } catch (error) {
      this.plugin.log(`Error creando notificación desde date picker: ${error}`);
      new Notice(getTranslation(this.language, "notices.errorCreatingNotification", { title: "Recordatorio" }));
      return false;
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

  // Actualizar contenido del modal según el tipo de notificación
  private updateModalContent(container: HTMLElement, dateInput: HTMLInputElement, timeInput: HTMLInputElement) {
    const dateContainer = container.querySelector('.notelert-date-container');
    const timeContainer = container.querySelector('.notelert-time-container');
    const quickActions = container.querySelector('#quick-actions-container');
    const locationListContainer = container.querySelector('#location-list-container');

    if (this.notificationType === 'location') {
      // Ocultar fecha, hora y acciones rápidas para ubicación
      if (dateContainer) (dateContainer as HTMLElement).style.display = 'none';
      if (timeContainer) (timeContainer as HTMLElement).style.display = 'none';
      if (quickActions) (quickActions as HTMLElement).style.display = 'none';

      // Mostrar o crear la lista de ubicaciones
      if (!locationListContainer) {
        this.renderLocationList(container);
      } else {
        (locationListContainer as HTMLElement).style.display = 'block';
      }
    } else {
      // Mostrar fecha, hora y acciones rápidas para tiempo
      if (dateContainer) (dateContainer as HTMLElement).style.display = 'block';
      if (timeContainer) (timeContainer as HTMLElement).style.display = 'block';
      if (quickActions) (quickActions as HTMLElement).style.display = 'block';

      // Ocultar lista de ubicaciones
      if (locationListContainer) {
        (locationListContainer as HTMLElement).style.display = 'none';
      }
    }
  }

  // Renderizar lista de ubicaciones en el modal
  private renderLocationList(container: HTMLElement) {
    // Eliminar lista anterior si existe
    const existingList = container.querySelector('#location-list-container');
    if (existingList) {
      existingList.remove();
    }

    const savedLocations = this.plugin.settings.savedLocations || [];

    if (savedLocations.length === 0) {
      const emptyMessage = container.createEl("div", {
        attr: {
          style: `
            padding: 20px;
            text-align: center;
            color: var(--text-muted);
            background: var(--background-secondary);
            border-radius: 6px;
            margin: 15px 0;
          `
        }
      });
      emptyMessage.id = "location-list-container";
      emptyMessage.textContent = getTranslation(this.language, "datePicker.noSavedLocations");
      return;
    }

    // Título
    const listTitle = container.createEl("h3", {
      text: getTranslation(this.language, "datePicker.selectLocationTitle"),
      attr: {
        style: `
          margin: 15px 0 10px 0;
          font-size: 16px;
          font-weight: 600;
          color: var(--text-normal);
          flex-shrink: 0;
        `
      }
    });

    // Contenedor FIJO con scroll SOLO para las tarjetas
    const scrollContainer = container.createEl("div", {
      attr: {
        style: `
          height: 400px;
          max-height: 400px;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 10px;
          margin: 10px 0;
          background: var(--background-primary);
          border: 2px solid var(--interactive-accent);
          border-radius: 8px;
          box-sizing: border-box;
          flex-shrink: 0;
        `
      }
    });
    scrollContainer.id = "location-list-container";

    // Crear items de ubicación - SOLO TÍTULO
    savedLocations.forEach((location, index) => {
      const locationItem = scrollContainer.createEl("div", {
        attr: {
          style: `
            padding: 12px 15px;
            margin: 8px 0;
            border: 2px solid var(--background-modifier-border);
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s;
            background: var(--background-primary);
            width: 100%;
            box-sizing: border-box;
            display: flex;
            align-items: center;
            justify-content: space-between;
          `
        }
      });
      locationItem.id = `location-item-${index}`;

      // Nombre de la ubicación
      const name = location.name || `Ubicación ${index + 1}`;
      const nameDiv = locationItem.createEl("div", {
        text: name,
        attr: {
          style: "font-weight: 500; font-size: 14px; flex: 1;"
        }
      });

      // Icono de check (oculto inicialmente)
      const checkIcon = locationItem.createEl("div", {
        text: "✓",
        attr: {
          style: `
            font-size: 18px;
            color: var(--interactive-accent);
            font-weight: bold;
            opacity: 0;
            transition: opacity 0.2s;
            margin-left: 10px;
          `
        }
      });
      checkIcon.id = `check-icon-${index}`;

      // Guardar referencia a la ubicación
      (locationItem as HTMLElement & { locationData?: SavedLocation; checkIcon?: HTMLElement }).locationData = location;
      (locationItem as HTMLElement & { locationData?: SavedLocation; checkIcon?: HTMLElement }).checkIcon = checkIcon;

      // Función para seleccionar/deseleccionar
      const selectLocation = () => {
        // Deseleccionar todas las demás
        savedLocations.forEach((_, idx) => {
          const item = document.getElementById(`location-item-${idx}`);
          const icon = document.getElementById(`check-icon-${idx}`);
          if (item && icon) {
            const nameEl = item.querySelector('div:first-child') as HTMLElement;
            item.style.background = "var(--background-primary)";
            item.style.borderColor = "var(--background-modifier-border)";
            if (nameEl) nameEl.style.color = "var(--text-normal)";
            icon.style.opacity = "0";
          }
        });

        // Seleccionar esta
        locationItem.style.background = "var(--interactive-accent)";
        locationItem.style.borderColor = "var(--interactive-accent)";
        nameDiv.style.color = "var(--text-on-accent)";
        checkIcon.style.opacity = "1";

        this.selectedLocation = location;
      };

      locationItem.addEventListener("click", selectLocation);

      locationItem.addEventListener("mouseenter", () => {
        if (this.selectedLocation !== location) {
          locationItem.style.background = "var(--background-modifier-hover)";
          locationItem.style.borderColor = "var(--interactive-accent)";
        }
      });

      locationItem.addEventListener("mouseleave", () => {
        if (this.selectedLocation !== location) {
          locationItem.style.background = "var(--background-primary)";
          locationItem.style.borderColor = "var(--background-modifier-border)";
        }
      });
    });
  }

  // Seleccionar ubicación de las guardadas
  private async selectLocationFromSaved(): Promise<SavedLocation | null> {
    return new Promise(async (resolve) => {
      try {
        // Crear modal primero para tener el área de debug disponible
        const modal = new Modal(this.app);
        modal.titleEl.setText(getTranslation(this.language, "datePicker.selectSavedLocation"));

        // Estilos responsive para el modal de selección - usar todo el ancho
        const { contentEl } = modal;
        contentEl.empty();
        contentEl.setAttribute("style", `
          min-width: 300px; 
          max-width: 600px; 
          width: 95vw;
          max-height: 85vh; 
          overflow: hidden;
          padding: 20px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          margin: 0 auto;
        `);

        // Asegurar que el modal tenga el z-index más alto
        const modalEl = (modal as Modal & { modalEl: HTMLElement }).modalEl;
        if (modalEl) {
          modalEl.style.zIndex = '10000';
          modalEl.style.position = 'fixed';
        }

        // Área de debug/logs visible - CREAR PRIMERO
        const debugContainer = contentEl.createEl("div", {
          attr: {
            style: `
              margin-bottom: 15px;
              padding: 12px;
              background: var(--background-secondary);
              border: 2px solid var(--background-modifier-border);
              border-radius: 8px;
              font-size: 11px;
              height: 150px;
              min-height: 150px;
              max-height: 200px;
              overflow-y: auto;
              overflow-x: hidden;
              font-family: 'Courier New', monospace;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
              flex-shrink: 0;
            `
          }
        });
        debugContainer.id = "location-select-debug-container";
        debugContainer.innerHTML = `
          <div style="font-weight: 700; margin-bottom: 8px; color: var(--text-accent); font-size: 12px; border-bottom: 1px solid var(--background-modifier-border); padding-bottom: 6px;">
            🔍 Debug - Ubicaciones Guardadas
          </div>
          <div id="location-select-debug-info" style="color: var(--text-normal); line-height: 1.6; word-wrap: break-word; min-height: 100px;"></div>
        `;

        // Función para añadir logs
        const addLog = (message: string) => {
          const debugInfo = document.getElementById("location-select-debug-info");
          if (debugInfo) {
            const timestamp = new Date().toLocaleTimeString();
            const existing = debugInfo.innerHTML || '';
            const color = message.includes('❌') || message.includes('Error') ? 'var(--text-error)' :
              message.includes('✅') ? 'var(--text-success)' : 'var(--text-normal)';
            debugInfo.innerHTML = `${existing}<div style="margin: 4px 0; padding: 4px 8px; font-size: 11px; color: ${color}; border-left: 3px solid ${color}; background: var(--background-secondary); border-radius: 3px; word-wrap: break-word; white-space: pre-wrap;"><span style="opacity: 0.7;">[${timestamp}]</span> ${message}</div>`;
            // Auto-scroll al final
            const container = document.getElementById("location-select-debug-container");
            if (container) {
              container.scrollTop = container.scrollHeight;
            }
          }
        };

        addLog('🔍 Iniciando búsqueda de ubicaciones guardadas...');

        // Recargar settings para asegurar que tenemos los datos más recientes
        addLog('📥 Recargando settings...');
        if (this.plugin.loadSettings) {
          await this.plugin.loadSettings();
          addLog('✅ Settings recargados');
        } else {
          addLog('⚠️ loadSettings no disponible, usando settings actuales');
        }

        // Obtener ubicaciones guardadas directamente de settings
        const locations = this.plugin.settings.savedLocations || [];

        addLog(`📊 Ubicaciones encontradas: ${locations.length}`);
        addLog(`📋 Settings object: ${JSON.stringify(this.plugin.settings).substring(0, 200)}...`);

        if (locations.length > 0) {
          locations.forEach((loc, idx) => {
            addLog(`📍 [${idx + 1}] ${loc.name || 'Sin nombre'} - Lat: ${loc.latitude}, Lon: ${loc.longitude}`);
          });
        } else {
          addLog('❌ No se encontraron ubicaciones en savedLocations');
          addLog(`🔍 Tipo de savedLocations: ${typeof this.plugin.settings.savedLocations}`);
          addLog(`🔍 savedLocations es null/undefined: ${this.plugin.settings.savedLocations === null || this.plugin.settings.savedLocations === undefined}`);
        }

        if (locations.length === 0) {
          addLog('⚠️ No hay ubicaciones para mostrar');
          new Notice(getTranslation(this.language, "datePicker.noSavedLocations"));
          modal.open();
          // No resolver inmediatamente, dejar que el usuario vea el debug
          return;
        }

        // Título para la lista de ubicaciones - FUERA del scrollContainer
        const listTitle = contentEl.createEl("h3", {
          text: "Selecciona una ubicación:",
          attr: {
            style: `
            margin: 15px 0 10px 0;
            font-size: 18px;
            font-weight: 600;
            color: var(--text-normal);
            flex-shrink: 0;
            display: block !important;
            visibility: visible !important;
          `
          }
        });

        // Contenedor con scroll - FORZAR VISIBILIDAD - FUERA del debug
        const scrollContainer = contentEl.createEl("div", {
          attr: {
            style: `
            flex: 1;
            min-height: 250px;
            max-height: 450px;
            overflow-y: auto;
            overflow-x: hidden;
            padding: 15px;
            margin: 10px 0;
            background: var(--background-primary);
            border: 3px solid var(--interactive-accent);
            border-radius: 8px;
            box-sizing: border-box;
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            position: relative;
            z-index: 100;
          `
          }
        });
        scrollContainer.id = "location-list-container";

        addLog('🎨 Creando elementos de la lista...');
        addLog(`📦 Contenedor creado con ID: location-list-container`);
        addLog(`📏 Altura del contenedor: ${scrollContainer.offsetHeight}px`);

        locations.forEach((location, index) => {
          addLog(`📝 Creando item ${index + 1}: ${location.name || 'Sin nombre'}`);

          const locationItem = scrollContainer.createEl("div", {
            attr: {
              style: `
              padding: 15px;
              margin: 10px 0;
              border: 2px solid var(--interactive-accent);
              border-radius: 6px;
              cursor: pointer;
              transition: all 0.2s;
              background: var(--background-primary);
              width: 100%;
              box-sizing: border-box;
              display: block !important;
              visibility: visible !important;
              opacity: 1 !important;
              position: relative;
              z-index: 10;
            `
            }
          });
          locationItem.id = `location-item-${index}`;

          locationItem.addEventListener("mouseenter", () => {
            locationItem.style.background = "var(--background-modifier-hover)";
          });
          locationItem.addEventListener("mouseleave", () => {
            locationItem.style.background = "var(--background-primary)";
          });

          const name = location.name || `Ubicación ${index + 1}`;
          locationItem.createEl("div", {
            text: name,
            attr: { style: "font-weight: 500; margin-bottom: 4px; font-size: 14px;" }
          });

          if (location.address) {
            locationItem.createEl("div", {
              text: location.address.length > 60 ? location.address.substring(0, 60) + "..." : location.address,
              attr: { style: "font-size: 12px; color: var(--text-muted); margin-bottom: 4px; word-wrap: break-word;" }
            });
          }

          locationItem.createEl("div", {
            text: `📍 ${location.latitude?.toFixed(6) || '0'}, ${location.longitude?.toFixed(6) || '0'}`,
            attr: { style: "font-size: 11px; color: var(--text-muted);" }
          });

          locationItem.addEventListener("click", () => {
            addLog(`✅ Ubicación seleccionada: ${location.name}`);
            modal.close();
            resolve(location);
          });

          addLog(`✅ Item ${index + 1} creado con ID: location-item-${index}`);
        });

        addLog(`✅ Lista creada con ${locations.length} ubicaciones`);
        addLog(`📏 Altura final del contenedor: ${scrollContainer.offsetHeight}px`);
        addLog(`👁️ Elementos hijos del contenedor: ${scrollContainer.children.length}`);

        // Forzar visibilidad del contenedor
        setTimeout(() => {
          const container = document.getElementById("location-list-container");
          if (container) {
            addLog(`🔍 Verificando contenedor después de renderizado...`);
            addLog(`  - display: ${window.getComputedStyle(container).display}`);
            addLog(`  - visibility: ${window.getComputedStyle(container).visibility}`);
            addLog(`  - opacity: ${window.getComputedStyle(container).opacity}`);
            addLog(`  - height: ${window.getComputedStyle(container).height}`);
            addLog(`  - overflow: ${window.getComputedStyle(container).overflow}`);
          }
        }, 100);

        modal.open();
      } catch (error) {
        this.plugin.log(`Error cargando settings: ${error}`);
        new Notice("Error cargando ubicaciones guardadas");
        resolve(null);
      }
    });
  }

  // Crear notificación desde ubicación guardada
  // Retorna true si fue exitoso, false si hubo error
  private async createNotificationFromLocation(location: SavedLocation): Promise<boolean> {
    try {
      // Reemplazar :@ o :# con :#nombreUbicacion
      const replacement = `:#${location.name}`;
      const line = this.editor.getLine(this.cursor.line);
      const beforeCursor = line.substring(0, this.cursor.ch - 2); // Quitar :@ o :#
      const afterCursor = line.substring(this.cursor.ch);
      const newLine = beforeCursor + replacement + afterCursor;

      this.editor.setLine(this.cursor.line, newLine);

      // Mover cursor al final del reemplazo
      const newCursor = {
        line: this.cursor.line,
        ch: beforeCursor.length + replacement.length
      };
      this.editor.setCursor(newCursor);

      // Obtener el título de la nota (nombre del archivo sin extensión)
      const activeFile = this.plugin.app.workspace.getActiveFile();
      const noteTitle = activeFile ? activeFile.basename : 'Nota';

      // Obtener la línea actual y limpiarla de los patrones :#ubicacion
      const currentLine = this.editor.getLine(this.cursor.line);
      const cleanMessage = currentLine.replace(/:#[^\s]+/g, '').trim();

      // Crear el patrón detectado
      const pattern: DetectedPattern = {
        text: newLine.trim(),
        title: noteTitle,
        message: cleanMessage,
        date: new Date().toISOString().split('T')[0],
        time: "00:00",
        fullMatch: replacement,
        startIndex: 0,
        endIndex: newLine.length,
        filePath: activeFile?.path,
        lineNumber: this.cursor.line + 1,
        location: location.name,
        latitude: location.latitude,
        longitude: location.longitude,
        radius: location.radius,
        type: 'location'
      };

      // Crear la notificación directamente
      await this.plugin.createNotificationAndMarkProcessed(pattern);

      // Success is void, so we assume success if no error was thrown

      this.plugin.log(`Notificación de ubicación creada: ${pattern.title} en ${location.name}`);
      return true;
    } catch (error) {
      this.plugin.log(`Error creando notificación de ubicación: ${error}`);
      new Notice(getTranslation(this.language, "notices.errorCreatingNotification", { title: "Recordatorio de ubicación" }));
      return false;
    }
  }

  // Mostrar estado de carga (spinner) en el botón
  private showLoadingState(button: HTMLButtonElement) {
    // Guardar el texto original
    (button as HTMLButtonElement & { __originalText?: string }).__originalText = button.textContent || undefined;

    // Deshabilitar botón
    button.disabled = true;
    button.style.opacity = '0.6';
    button.style.cursor = 'not-allowed';

    // Agregar spinner
    button.innerHTML = `
      <span style="display: inline-block; margin-right: 8px;">
        <svg width="16" height="16" viewBox="0 0 24 24" style="animation: spin 1s linear infinite;">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" opacity="0.25"/>
          <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" opacity="0.75"/>
        </svg>
      </span>
      ${getTranslation(this.language, "datePicker.confirmButton") || "Confirmando..."}
    `;

    // Agregar animación CSS si no existe
    if (!document.getElementById('notelert-spinner-style')) {
      const style = document.createElement('style');
      style.id = 'notelert-spinner-style';
      style.textContent = `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }
  }

  // Ocultar estado de carga y restaurar botón
  private hideLoadingState(button: HTMLButtonElement) {
    // Restaurar texto original
    const originalText =
      (button as HTMLButtonElement & { __originalText?: string }).__originalText ||
      getTranslation(this.language, "datePicker.confirmButton") ||
      "Confirmar";
    button.textContent = originalText;

    // Restaurar estado del botón
    button.disabled = false;
    button.style.opacity = '1';
    button.style.cursor = 'pointer';
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

