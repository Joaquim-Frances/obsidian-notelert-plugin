import { App, Editor, EditorPosition, Modal, Notice, Platform, requestUrl } from "obsidian";
import { DetectedPattern, SavedLocation } from "../core/types";
import { getTranslation } from "../i18n";
import { INotelertPlugin } from "../core/plugin-interface";
import { setCssProps } from "../core/dom";
import { PLUGIN_LIST_LOCATIONS_URL } from "../core/config";

export class NotelertDatePickerModal extends Modal {
  private onCancel: () => void;
  private language: string;
  private plugin: INotelertPlugin;
  private editor: Editor;
  private cursor: EditorPosition;
  private originalText: string;
  private notificationType: 'time' | 'location' = 'time'; // Tipo de notificación
  private selectedLocation: SavedLocation | null = null; // Ubicación seleccionada
  private locationsLoading: boolean = false;
  private locationsError: string | null = null;
  private debugLogs: string[] = []; // Array para almacenar logs
  private showDebugPanel: boolean = false; // Estado del panel de debug
  private trigger: string; // Trigger personalizado (por defecto :@)

  constructor(app: App, plugin: INotelertPlugin, language: string, editor: Editor, cursor: EditorPosition, originalText: string, trigger: string, onCancel: () => void) {
    super(app);
    this.plugin = plugin;
    this.language = language;
    this.editor = editor;
    this.cursor = cursor;
    this.originalText = originalText;
    this.trigger = trigger || ':@';
    this.onCancel = onCancel;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    const isDesktop = !Platform.isMobile;

    // Estilos responsive para el modal - optimizado para desktop
    setCssProps(contentEl, {
      minWidth: isDesktop ? "400px" : "300px",
      maxWidth: isDesktop ? "500px" : "600px",
      width: isDesktop ? "auto" : "95vw",
      maxHeight: isDesktop ? "auto" : "90vh",
      overflow: "hidden",
      padding: isDesktop ? "25px" : "20px",
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      margin: "0 auto",
    });

    // Contenedor con scroll interno (solo si es necesario en móvil)
    const scrollContainer = contentEl.createEl("div");
    setCssProps(scrollContainer, {
      flex: "1",
      overflowY: isDesktop ? "visible" : "auto",
      overflowX: "hidden",
      paddingRight: isDesktop ? "0" : "5px",
      marginBottom: "10px",
    });

    const titleEl = scrollContainer.createEl("h2", {
      text: getTranslation(this.language, "datePicker.title"),
    });
    setCssProps(titleEl, {
      margin: "0 0 15px 0",
      fontSize: "18px",
      fontWeight: "600",
    });

    // Contenedor principal - usar todo el ancho
    const container = scrollContainer.createEl("div", { cls: "notelert-datepicker-container" });
    setCssProps(container, {
      margin: "0",
      width: "100%",
    });

    // En desktop, forzar tipo 'time' (no hay ubicaciones)
    if (isDesktop) {
      this.notificationType = 'time';
    }

    // Selector de fecha
    const dateContainer = container.createEl("div", { cls: "notelert-date-container" });
    setCssProps(dateContainer, { marginBottom: "15px" });

    const dateLabel = dateContainer.createEl("label", { text: getTranslation(this.language, "datePicker.dateLabel") });
    setCssProps(dateLabel, {
      display: "block",
      marginBottom: "5px",
      fontWeight: "500",
    });

    const dateInput = dateContainer.createEl("input", {
      type: "date",
      cls: "notelert-date-input"
    });
    setCssProps(dateInput, {
      width: "100%",
      padding: "10px",
      border: "1px solid var(--background-modifier-border)",
      borderRadius: "6px",
      boxSizing: "border-box",
      fontSize: "14px",
    });

    // Selector de hora - visual con botones +/- (mejor UX)
    const timeContainer = container.createEl("div", { cls: "notelert-time-container" });
    setCssProps(timeContainer, { marginBottom: "20px" });

    const timeLabel = timeContainer.createEl("label", { text: getTranslation(this.language, "datePicker.timeLabel") });
    setCssProps(timeLabel, {
      display: "block",
      marginBottom: "10px",
      fontWeight: "500",
    });

    // Contenedor para el selector visual de hora
    const timePickerContainer = timeContainer.createEl("div");
    setCssProps(timePickerContainer, {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: isDesktop ? "20px" : "15px",
      padding: isDesktop ? "20px" : "15px",
      background: "var(--background-secondary)",
      borderRadius: "8px",
      border: "1px solid var(--background-modifier-border)",
    });

    // Selector de horas
    const hoursContainer = timePickerContainer.createEl("div");
    setCssProps(hoursContainer, {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "8px",
    });

    const hoursLabel = hoursContainer.createEl("div", {
      text: getTranslation(this.language, "datePicker.hours"),
    });
    setCssProps(hoursLabel, {
      fontSize: "11px",
      color: "var(--text-muted)",
      textTransform: "uppercase",
      fontWeight: "500",
      letterSpacing: "0.5px",
    });

    const hoursDisplay = hoursContainer.createEl("div", {
      text: "12",
    });
    setCssProps(hoursDisplay, {
      fontSize: isDesktop ? "32px" : "28px",
      fontWeight: "600",
      color: "var(--text-normal)",
      minWidth: isDesktop ? "60px" : "50px",
      textAlign: "center",
      padding: isDesktop ? "10px 15px" : "8px 12px",
      background: "var(--background-primary)",
      borderRadius: "6px",
      border: "2px solid var(--interactive-accent)",
    });
    hoursDisplay.id = "hours-display";

    const hoursButtons = hoursContainer.createEl("div");
    setCssProps(hoursButtons, {
      display: "flex",
      gap: "8px",
      alignItems: "center",
    });

    const hoursDecreaseBtn = hoursButtons.createEl("button", {
      text: "−",
    });
    setCssProps(hoursDecreaseBtn, {
      width: isDesktop ? "36px" : "32px",
      height: isDesktop ? "36px" : "32px",
      borderRadius: "6px",
      border: "1px solid var(--background-modifier-border)",
      background: "var(--background-primary)",
      fontSize: isDesktop ? "20px" : "18px",
      fontWeight: "600",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "all 0.2s",
    });
    hoursDecreaseBtn.addEventListener("mouseenter", () => {
      setCssProps(hoursDecreaseBtn, {
        background: "var(--background-modifier-hover)",
        borderColor: "var(--interactive-accent)",
      });
    });
    hoursDecreaseBtn.addEventListener("mouseleave", () => {
      setCssProps(hoursDecreaseBtn, {
        background: "var(--background-primary)",
        borderColor: "var(--background-modifier-border)",
      });
    });

    const hoursIncreaseBtn = hoursButtons.createEl("button", {
      text: "+",
    });
    setCssProps(hoursIncreaseBtn, {
      width: isDesktop ? "36px" : "32px",
      height: isDesktop ? "36px" : "32px",
      borderRadius: "6px",
      border: "1px solid var(--background-modifier-border)",
      background: "var(--background-primary)",
      fontSize: isDesktop ? "20px" : "18px",
      fontWeight: "600",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "all 0.2s",
    });
    hoursIncreaseBtn.addEventListener("mouseenter", () => {
      setCssProps(hoursIncreaseBtn, {
        background: "var(--background-modifier-hover)",
        borderColor: "var(--interactive-accent)",
      });
    });
    hoursIncreaseBtn.addEventListener("mouseleave", () => {
      setCssProps(hoursIncreaseBtn, {
        background: "var(--background-primary)",
        borderColor: "var(--background-modifier-border)",
      });
    });

    // Separador
    const colonEl = timePickerContainer.createEl("div", {
      text: ":",
    });
    setCssProps(colonEl, {
      fontSize: isDesktop ? "32px" : "28px",
      fontWeight: "600",
      color: "var(--text-normal)",
      margin: `0 ${isDesktop ? "10px" : "5px"}`,
    });

    // Selector de minutos
    const minutesContainer = timePickerContainer.createEl("div");
    setCssProps(minutesContainer, {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "8px",
    });

    const minutesLabel = minutesContainer.createEl("div", {
      text: getTranslation(this.language, "datePicker.minutes"),
    });
    setCssProps(minutesLabel, {
      fontSize: "11px",
      color: "var(--text-muted)",
      textTransform: "uppercase",
      fontWeight: "500",
      letterSpacing: "0.5px",
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
      setCssProps(minutesDecreaseBtn, {
        background: "var(--background-modifier-hover)",
        borderColor: "var(--interactive-accent)",
      });
    });
    minutesDecreaseBtn.addEventListener("mouseleave", () => {
      setCssProps(minutesDecreaseBtn, {
        background: "var(--background-primary)",
        borderColor: "var(--background-modifier-border)",
      });
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
      setCssProps(minutesIncreaseBtn, {
        background: "var(--background-modifier-hover)",
        borderColor: "var(--interactive-accent)",
      });
    });
    minutesIncreaseBtn.addEventListener("mouseleave", () => {
      setCssProps(minutesIncreaseBtn, {
        background: "var(--background-primary)",
        borderColor: "var(--background-modifier-border)",
      });
    });

    // Input oculto para mantener compatibilidad
    const timeInput = timeContainer.createEl("input", {
      type: "time",
      cls: "notelert-time-input"
    });
    setCssProps(timeInput, { display: "none" });
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
          setCssProps(btn, {
            background: "var(--background-modifier-hover)",
            borderColor: "var(--interactive-accent)",
          });
        });
        btn.addEventListener("mouseleave", () => {
          setCssProps(btn, {
            background: "var(--background-primary)",
            borderColor: "var(--background-modifier-border)",
          });
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
    setCssProps(typeContainer, {
      marginBottom: "20px",
      padding: "15px",
      background: "var(--background-secondary)",
      borderRadius: "6px",
      width: "100%",
      boxSizing: "border-box",
      display: isDesktop ? "none" : "",
    });

    const typeLabel = typeContainer.createEl("label", {
      text: getTranslation(this.language, "datePicker.notificationType"),
      attr: { style: "display: block; margin-bottom: 8px; font-weight: 500; font-size: 14px;" }
    });

    const typeButtonsContainer = typeContainer.createEl("div");
    setCssProps(typeButtonsContainer, {
      display: "flex",
      gap: "10px",
      flexWrap: "wrap",
      width: "100%",
    });

    const timeButton = typeButtonsContainer.createEl("button", {
      text: "⏰ " + getTranslation(this.language, "datePicker.timeNotification"),
      cls: "mod-cta"
    });
    setCssProps(timeButton, {
      flex: "1",
      minWidth: "120px",
      padding: "10px",
      fontSize: "14px",
      whiteSpace: "nowrap",
    });
    timeButton.id = "notification-type-time";

    const locationButton = typeButtonsContainer.createEl("button", {
      text: "📍 " + getTranslation(this.language, "datePicker.locationNotification"),
      cls: "mod-secondary"
    });
    setCssProps(locationButton, {
      flex: "1",
      minWidth: "120px",
      padding: "10px",
      fontSize: "14px",
      whiteSpace: "nowrap",
    });
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

    // Botón para mostrar/ocultar logs de debug (solo en móvil)
    if (!isDesktop) {
      const debugToggleContainer = container.createEl("div");
      setCssProps(debugToggleContainer, {
        marginBottom: "10px",
        display: "flex",
        justifyContent: "flex-end",
      });

      const debugToggleBtn = debugToggleContainer.createEl("button", {
        text: "🔍 Ver logs",
        cls: "mod-secondary"
      });
      setCssProps(debugToggleBtn, {
        padding: "6px 12px",
        fontSize: "12px",
      });
      debugToggleBtn.id = "debug-toggle-btn";

      debugToggleBtn.addEventListener("click", () => {
        this.showDebugPanel = !this.showDebugPanel;
        this.renderDebugPanel(container);
        debugToggleBtn.textContent = this.showDebugPanel ? "🔍 Ocultar logs" : "🔍 Ver logs";
      });
    }

    // Botones de acción rápida (solo para tipo 'time')
    const quickActions = container.createEl("div", { cls: "notelert-quick-actions" });
    setCssProps(quickActions, {
      marginBottom: "20px",
      width: "100%",
      boxSizing: "border-box",
    });
    quickActions.id = "quick-actions-container";

    const quickActionsTitle = quickActions.createEl("p", { text: getTranslation(this.language, "datePicker.quickActions") });
    setCssProps(quickActionsTitle, {
      marginBottom: "10px",
      fontWeight: "500",
    });

    const quickButtonsContainer = quickActions.createEl("div");
    setCssProps(quickButtonsContainer, {
      display: "flex",
      gap: "8px",
      flexWrap: "wrap",
      width: "100%",
    });

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
      setCssProps(button, {
        padding: "4px 8px",
        fontSize: "12px",
      });
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
    setCssProps(buttonContainer, {
      display: "flex",
      gap: "10px",
      justifyContent: "flex-end",
      marginTop: "10px",
      flexWrap: "wrap",
      flexShrink: "0",
      paddingTop: "10px",
      borderTop: "1px solid var(--background-modifier-border)",
      width: "100%",
      boxSizing: "border-box",
    });

    const cancelButton = buttonContainer.createEl("button", {
      text: getTranslation(this.language, "datePicker.cancelButton"),
      cls: "mod-secondary"
    });
    setCssProps(cancelButton, {
      flex: "1",
      minWidth: "120px",
      padding: "12px 20px",
      fontSize: "14px",
      boxSizing: "border-box",
    });
    cancelButton.addEventListener("click", () => {
      this.onCancel();
      this.close();
    });

    const confirmButton = buttonContainer.createEl("button", {
      text: getTranslation(this.language, "datePicker.confirmButton"),
      cls: "mod-cta"
    });
    setCssProps(confirmButton, {
      flex: "1",
      minWidth: "120px",
      padding: "12px 20px",
      fontSize: "14px",
      boxSizing: "border-box",
    });
    confirmButton.id = "datepicker-confirm-button";

    confirmButton.addEventListener("click", () => {
      // Mostrar spinner y deshabilitar botón
      this.showLoadingState(confirmButton);
      const addLog = (message: string) => {
        const debugInfo = document.getElementById("datepicker-debug-info");
        if (debugInfo) {
          const timestamp = new Date().toLocaleTimeString();
          const color = message.includes('❌') || message.includes('Error') ? 'var(--text-error)' :
            message.includes('✅') ? 'var(--text-success)' : 'var(--text-normal)';

          const line = debugInfo.createEl("div");
          setCssProps(line, {
            margin: "4px 0",
            padding: "4px 8px",
            fontSize: "11px",
            color,
            borderLeft: `3px solid ${color}`,
            background: "var(--background-secondary)",
            borderRadius: "3px",
            wordWrap: "break-word",
            whiteSpace: "pre-wrap",
          } as Partial<CSSStyleDeclaration>);
          line.textContent = `[${timestamp}] ${message}`;

          const container = document.getElementById("datepicker-debug-container");
          if (container) {
            container.scrollTop = container.scrollHeight;
          }
        }
      };

      void (async () => {
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
              // Reemplazar el trigger con trigger+fecha, hora
              const replacement = `${this.trigger}${date}, ${time}`;
              const line = this.editor.getLine(this.cursor.line);
              const beforeCursor = line.substring(0, this.cursor.ch - this.trigger.length); // Quitar el trigger
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
      })();
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

      // Obtener la línea actual y limpiarla de los patrones trigger+fecha, hora
      const currentLine = this.editor.getLine(this.cursor.line);
      // Escapar el trigger para usar en regex
      const escapedTrigger = this.trigger.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const cleanMessage = currentLine.replace(new RegExp(`${escapedTrigger}[^,\\s]+,\\s*[^\\s]+`, 'g'), '').trim();

      // Crear el patrón detectado
      const pattern: DetectedPattern = {
        text: fullText.trim(),
        title: noteTitle,
        message: cleanMessage,
        date: date,
        time: time,
        fullMatch: `${this.trigger}${date}, ${time}`,
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
      //     this.addVisualFeedback(fullText, `${this.trigger}${date}, ${time}`);
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
    // Remover el patrón trigger+fecha, hora del texto
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
    const debugPanel = container.querySelector('#debug-panel-container');

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
    
    // Mantener el panel de debug visible si estaba visible
    if (this.showDebugPanel && debugPanel) {
      (debugPanel as HTMLElement).style.display = 'block';
    } else if (this.showDebugPanel && !debugPanel) {
      this.renderDebugPanel(container);
    }
  }

  // Renderizar lista de ubicaciones en el modal
  /**
   * Añade un log al panel de debug y también lo registra en la consola
   */
  private addDebugLog(message: string) {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    this.debugLogs.push(logEntry);
    
    // Mantener solo los últimos 50 logs
    if (this.debugLogs.length > 50) {
      this.debugLogs.shift();
    }
    
    // También loggear en consola si está disponible
    this.plugin.log(message);
    
    // Si el panel está visible, actualizarlo
    if (this.showDebugPanel) {
      const container = document.querySelector('.notelert-datepicker-container');
      if (container instanceof HTMLElement) {
        this.renderDebugPanel(container);
      }
    }
  }

  /**
   * Renderiza el panel de debug con los logs
   */
  private renderDebugPanel(container: HTMLElement) {
    // Eliminar panel anterior si existe
    const existingPanel = container.querySelector('#debug-panel-container');
    if (existingPanel) {
      existingPanel.remove();
    }

    if (!this.showDebugPanel) {
      return;
    }

    const panelWrapper = container.createEl("div", {
      attr: {
        style: `
          margin-top: 15px;
          width: 100%;
          box-sizing: border-box;
        `
      }
    });
    panelWrapper.id = "debug-panel-container";

    // Título
    const title = panelWrapper.createEl("h3", {
      text: "📋 Logs de Debug",
    });
    setCssProps(title, {
      margin: "0 0 10px 0",
      fontSize: "16px",
      fontWeight: "600",
    });

    const logContainer = panelWrapper.createEl("div");
    setCssProps(logContainer, {
      height: "200px",
      maxHeight: "200px",
      overflowY: "auto",
      overflowX: "hidden",
      padding: "10px",
      margin: "5px 0",
      background: "var(--background-primary)",
      border: "2px solid var(--interactive-accent)",
      borderRadius: "8px",
      boxSizing: "border-box",
      fontFamily: "monospace",
      fontSize: "11px",
    } as Partial<CSSStyleDeclaration>);
    logContainer.id = "debug-log-container";

    if (this.debugLogs.length === 0) {
      const emptyEl = logContainer.createEl("div", {
        text: "No hay logs aún. Los logs aparecerán aquí cuando se carguen las ubicaciones.",
      });
      setCssProps(emptyEl, {
        padding: "10px",
        textAlign: "center",
        color: "var(--text-muted)",
        fontSize: "12px",
      });
    } else {
      this.debugLogs.forEach((log) => {
        const color = log.includes('❌') || log.includes('Error') ? 'var(--text-error)' :
          log.includes('✅') ? 'var(--text-success)' :
          log.includes('⚠️') ? 'var(--text-warning)' :
          'var(--text-normal)';
        const bgColor = log.includes('❌') || log.includes('Error') ? 'rgba(255, 0, 0, 0.1)' :
          log.includes('✅') ? 'rgba(0, 255, 0, 0.1)' : 'transparent';

        const logLine = logContainer.createEl("div");
        setCssProps(logLine, {
          margin: "2px 0",
          padding: "4px 6px",
          color,
          background: bgColor,
          borderLeft: `2px solid ${color}`,
          borderRadius: "2px",
          wordWrap: "break-word",
          whiteSpace: "pre-wrap",
        } as Partial<CSSStyleDeclaration>);
        logLine.textContent = log;
      });
      
      // Auto-scroll al final
      logContainer.scrollTop = logContainer.scrollHeight;
    }
  }

  private renderLocationList(container: HTMLElement) {
    // Eliminar lista anterior si existe
    const existingList = container.querySelector('#location-list-container');
    if (existingList) {
      existingList.remove();
    }

    const listWrapper = container.createEl("div", {
      attr: {
        style: `
          margin-top: 15px;
          width: 100%;
          box-sizing: border-box;
        `
      }
    });

    // Título
    const title = listWrapper.createEl("h3", {
      text: getTranslation(this.language, "datePicker.selectLocationTitle") || "Selecciona una ubicación",
    });
    setCssProps(title, {
      margin: "0 0 10px 0",
      fontSize: "16px",
      fontWeight: "600",
    });

    const listContainer = listWrapper.createEl("div");
    setCssProps(listContainer, {
      height: "260px",
      maxHeight: "260px",
      overflowY: "auto",
      overflowX: "hidden",
      padding: "10px",
      margin: "5px 0",
      background: "var(--background-primary)",
      border: "2px solid var(--interactive-accent)",
      borderRadius: "8px",
      boxSizing: "border-box",
    } as Partial<CSSStyleDeclaration>);
    listContainer.id = "location-list-container";

    // Mostrar estado "Cargando..." con spinner visual animado
    listContainer.empty();
    const loadingContainer = listContainer.createEl("div");
    setCssProps(loadingContainer, {
      padding: "30px 20px",
      textAlign: "center",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "12px",
    });

    // Spinner animado (CSS)
    const spinner = loadingContainer.createEl("div");
    spinner.innerHTML = `
      <div style="
        width: 32px;
        height: 32px;
        border: 3px solid var(--background-modifier-border);
        border-top-color: var(--interactive-accent);
        border-top-color: var(--interactive-accent);
        border-radius: 50%;
        animation: spin 1s linear infinite;
      "></div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;

    const loadingText = loadingContainer.createEl("div", {
      text: getTranslation(this.language, "datePicker.loadingLocations") || "Cargando ubicaciones...",
    });
    setCssProps(loadingText, {
      color: "var(--text-muted)",
      fontSize: "13px",
    });

    void this.loadLocationsFromBackend(listContainer);

  }

  private async loadLocationsFromBackend(listContainer: HTMLElement): Promise<void> {
    try {
      this.locationsLoading = true;
      this.locationsError = null;

      const token = this.plugin.settings.pluginToken?.trim();
      this.addDebugLog(`[Ubicaciones] Iniciando carga de ubicaciones. Token presente: ${!!token}, Longitud: ${token?.length || 0}`);
      
      if (!token) {
        listContainer.empty();
        const tokenContainer = listContainer.createEl("div");
        setCssProps(tokenContainer, {
          padding: "20px",
          textAlign: "center",
        });

        const tokenIcon = tokenContainer.createEl("div", {
          text: "🔑",
        });
        setCssProps(tokenIcon, {
          fontSize: "32px",
          marginBottom: "12px",
        });

        const tokenTitle = tokenContainer.createEl("div", {
          text: getTranslation(this.language, "datePicker.tokenRequiredTitle") || "Token del plugin requerido",
        });
        setCssProps(tokenTitle, {
          color: "var(--text-normal)",
          fontSize: "16px",
          fontWeight: "600",
          marginBottom: "8px",
        });

        const tokenDesc = tokenContainer.createEl("div", {
          text: getTranslation(this.language, "datePicker.tokenRequiredDesc") || 
            "Las notificaciones de ubicación requieren un usuario Premium con token válido.\n\nPara obtener tu token:\n1. Abre la app Notelert en tu móvil\n2. Ve a Settings > Token del Plugin\n3. Copia el token y pégalo en Settings > Notelert > Plugin Token",
        });
        setCssProps(tokenDesc, {
          color: "var(--text-muted)",
          fontSize: "13px",
          lineHeight: "1.6",
          whiteSpace: "pre-line",
          marginBottom: "12px",
        });

        const settingsButton = tokenContainer.createEl("button", {
          text: getTranslation(this.language, "datePicker.openSettings") || "⚙️ Abrir Settings",
        });
        setCssProps(settingsButton, {
          padding: "10px 20px",
          borderRadius: "6px",
          border: "1px solid var(--interactive-accent)",
          background: "var(--interactive-accent)",
          color: "var(--text-on-accent)",
          fontSize: "14px",
          fontWeight: "500",
          cursor: "pointer",
          width: "100%",
        });
        settingsButton.addEventListener("click", async () => {
          // Cerrar el modal primero
          this.close();
          
          // Abrir la app Notelert en la pantalla de Account (donde está el token del plugin)
          const accountLink = "notelert://account";
          
          try {
            // Intentar abrir la app móvil
            if (typeof window !== 'undefined') {
              window.location.href = accountLink;
              
              // Si falla después de 2 segundos, abrir Play Store
              setTimeout(() => {
                const playStoreLink = "https://play.google.com/store/apps/details?id=com.quim79.notelert";
                window.open(playStoreLink, "_blank");
              }, 2000);
            }
          } catch (error) {
            // Si falla, abrir Play Store directamente
            const playStoreLink = "https://play.google.com/store/apps/details?id=com.quim79.notelert";
            if (typeof window !== 'undefined') {
              window.open(playStoreLink, "_blank");
            }
          }
        });

        this.addDebugLog(`[Ubicaciones] ❌ No hay token configurado`);
        return;
      }

      this.addDebugLog(`[Ubicaciones] Llamando a: ${PLUGIN_LIST_LOCATIONS_URL}`);
      this.addDebugLog(`[Ubicaciones] Token (primeros 8 chars): ${token.substring(0, 8)}...`);

      const response = await requestUrl({
        url: PLUGIN_LIST_LOCATIONS_URL,
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Plugin-Token": token,
        },
      });

      this.addDebugLog(`[Ubicaciones] Respuesta recibida: status=${response.status}`);

      if (response.status >= 400) {
        const errorData = (response.json ?? {}) as { error?: string; message?: string; isPremium?: boolean };
        const errorMessage = errorData.message || errorData.error || `HTTP ${response.status}`;
        this.addDebugLog(`[Ubicaciones] ❌ Error HTTP ${response.status}: ${errorMessage}`);
        console.error('[Notelert] Error cargando ubicaciones:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          fullResponse: response.json
        });
        
        // Si es error 403, probablemente es porque el usuario no es premium
        if (response.status === 403) {
          const premiumError = new Error('PREMIUM_REQUIRED');
          (premiumError as any).status = 403;
          (premiumError as any).errorData = errorData;
          throw premiumError;
        }
        
        throw new Error(errorMessage);
      }

      const data = (response.json ?? {}) as {
        success?: boolean;
        locations?: SavedLocation[];
        count?: number;
        message?: string;
        error?: string;
      };

      this.addDebugLog(`[Ubicaciones] Respuesta parseada: success=${data.success}, count=${data.count}, locations=${data.locations?.length || 0}`);
      this.addDebugLog(`[Ubicaciones] Respuesta completa: ${JSON.stringify(data, null, 2)}`);
      console.log('[Notelert] Respuesta completa del backend:', data);

      if (!data.success) {
        const errorMessage = data.message || data.error || 'Error desconocido al cargar ubicaciones';
        this.addDebugLog(`[Ubicaciones] ❌ Backend reportó error: ${errorMessage}`);
        console.error('[Notelert] Backend reportó error:', errorMessage);
        throw new Error(errorMessage);
      }

      const locations = Array.isArray(data.locations) ? data.locations : [];
      this.addDebugLog(`[Ubicaciones] ✅ Ubicaciones cargadas: ${locations.length}`);
      
      if (locations.length > 0) {
        locations.forEach((loc, idx) => {
          this.addDebugLog(`[Ubicaciones]   ${idx + 1}. ${loc.name} (${loc.latitude}, ${loc.longitude})`);
        });
      } else {
        this.addDebugLog(`[Ubicaciones] ⚠️ Array de ubicaciones vacío`);
        this.addDebugLog(`[Ubicaciones] ⚠️ Verifica que el userId del token coincida con el de la app`);
        this.addDebugLog(`[Ubicaciones] ⚠️ Revisa los logs del backend para ver qué userId se está usando`);
      }

      listContainer.empty();

      if (!locations.length) {
        const emptyContainer = listContainer.createEl("div");
        setCssProps(emptyContainer, {
          padding: "20px",
          textAlign: "center",
        });

        const emptyIcon = emptyContainer.createEl("div", {
          text: "📍",
        });
        setCssProps(emptyIcon, {
          fontSize: "32px",
          marginBottom: "12px",
        });

        const emptyTitle = emptyContainer.createEl("div", {
          text: getTranslation(this.language, "datePicker.noSavedLocationsTitle") || "No hay ubicaciones guardadas",
        });
        setCssProps(emptyTitle, {
          color: "var(--text-normal)",
          fontSize: "15px",
          fontWeight: "600",
          marginBottom: "8px",
        });

        const emptyDesc = emptyContainer.createEl("div", {
          text: getTranslation(this.language, "datePicker.noSavedLocationsDesc") || 
            "Para crear ubicaciones:\n1. Abre la app Notelert en tu móvil\n2. Ve a Settings > Mis Ubicaciones\n3. Añade ubicaciones desde el mapa\n4. Vuelve aquí y recarga la lista",
        });
        setCssProps(emptyDesc, {
          color: "var(--text-muted)",
          fontSize: "12px",
          lineHeight: "1.6",
          whiteSpace: "pre-line",
          marginBottom: "12px",
        });

        const reloadButton = emptyContainer.createEl("button", {
          text: getTranslation(this.language, "datePicker.reloadLocations") || "🔄 Recargar ubicaciones",
        });
        setCssProps(reloadButton, {
          padding: "8px 16px",
          borderRadius: "6px",
          border: "1px solid var(--interactive-accent)",
          background: "var(--interactive-accent)",
          color: "var(--text-on-accent)",
          fontSize: "13px",
          cursor: "pointer",
          marginTop: "8px",
        });
        reloadButton.addEventListener("click", () => {
          this.renderLocationList(listContainer.parentElement as HTMLElement);
        });

        return;
      }

      locations.forEach((location, index) => {
        const locationItem = listContainer.createEl("div", {
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

        const name = location.name || `Ubicación ${index + 1}`;
        const nameDiv = locationItem.createEl("div", {
          text: name,
          attr: {
            style: "font-weight: 500; font-size: 14px; flex: 1;"
          }
        });

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

        const selectLocation = () => {
          locations.forEach((_, idx) => {
        const item = document.getElementById(`location-item-${idx}`);
        const icon = document.getElementById(`check-icon-${idx}`);
        if (item && icon) {
          const firstDiv = item.querySelector('div:first-child');
          setCssProps(item, {
            background: "var(--background-primary)",
            borderColor: "var(--background-modifier-border)",
          });
          if (firstDiv instanceof HTMLElement) {
            setCssProps(firstDiv, { color: "var(--text-normal)" });
          }
          setCssProps(icon, { opacity: "0" });
        }
          });

          setCssProps(locationItem, {
            background: "var(--interactive-accent)",
            borderColor: "var(--interactive-accent)",
          });
          setCssProps(nameDiv, { color: "var(--text-on-accent)" });
          setCssProps(checkIcon, { opacity: "1" });

          this.selectedLocation = location;
        };

        locationItem.addEventListener("click", selectLocation);

        locationItem.addEventListener("mouseenter", () => {
          if (this.selectedLocation !== location) {
            setCssProps(locationItem, {
              background: "var(--background-modifier-hover)",
              borderColor: "var(--interactive-accent)",
            });
          }
        });

        locationItem.addEventListener("mouseleave", () => {
          if (this.selectedLocation !== location) {
            setCssProps(locationItem, {
              background: "var(--background-primary)",
              borderColor: "var(--background-modifier-border)",
            });
          }
        });
      });
    } catch (error: any) {
      this.locationsError = error?.message || "Error cargando ubicaciones";
      this.addDebugLog(`[Ubicaciones] ❌ Excepción: ${error?.message || String(error)}`);
      this.addDebugLog(`[Ubicaciones] ❌ Error completo: ${JSON.stringify(error)}`);
      listContainer.empty();
      
      // Detectar si es error de premium requerido
      if (error?.message === 'PREMIUM_REQUIRED' || error?.status === 403) {
        const premiumContainer = listContainer.createEl("div");
        setCssProps(premiumContainer, {
          padding: "20px",
          textAlign: "center",
        });

        const premiumIcon = premiumContainer.createEl("div", {
          text: "💎",
        });
        setCssProps(premiumIcon, {
          fontSize: "32px",
          marginBottom: "12px",
        });

        const premiumTitle = premiumContainer.createEl("div", {
          text: getTranslation(this.language, "datePicker.premiumRequiredTitle") || "Plan Premium requerido",
        });
        setCssProps(premiumTitle, {
          color: "var(--text-normal)",
          fontSize: "16px",
          fontWeight: "600",
          marginBottom: "8px",
        });

        const premiumDesc = premiumContainer.createEl("div", {
          text: getTranslation(this.language, "datePicker.premiumRequiredDesc") || 
            "Las notificaciones de ubicación solo están disponibles en el plan Premium.\n\nActualiza a Premium para usar esta función.",
        });
        setCssProps(premiumDesc, {
          color: "var(--text-muted)",
          fontSize: "13px",
          lineHeight: "1.6",
          whiteSpace: "pre-line",
          marginBottom: "16px",
        });

        // Botón para abrir paywall en la app
        const openAppButton = premiumContainer.createEl("button", {
          text: getTranslation(this.language, "datePicker.openAppToUpgrade") || "📱 Abrir app para actualizar",
        });
        setCssProps(openAppButton, {
          padding: "10px 20px",
          borderRadius: "6px",
          border: "1px solid var(--interactive-accent)",
          background: "var(--interactive-accent)",
          color: "var(--text-on-accent)",
          fontSize: "14px",
          fontWeight: "500",
          cursor: "pointer",
          marginBottom: "8px",
          width: "100%",
        });
        openAppButton.addEventListener("click", async () => {
          // Intentar abrir deeplink al paywall de la app
          const paywallLink = "notelert://paywall";
          try {
            // Intentar abrir la app
            window.location.href = paywallLink;
            // Si falla, redirigir a Play Store después de un delay
            setTimeout(() => {
              const playStoreLink = "https://play.google.com/store/apps/details?id=com.quim79.notelert";
              window.open(playStoreLink, "_blank");
            }, 2000);
          } catch (e) {
            // Si falla, abrir Play Store directamente
            const playStoreLink = "https://play.google.com/store/apps/details?id=com.quim79.notelert";
            window.open(playStoreLink, "_blank");
          }
        });

        // Botón alternativo para Play Store si no tiene la app
        const playStoreButton = premiumContainer.createEl("button", {
          text: getTranslation(this.language, "datePicker.installApp") || "📥 Instalar app desde Play Store",
        });
        setCssProps(playStoreButton, {
          padding: "8px 16px",
          borderRadius: "6px",
          border: "1px solid var(--background-modifier-border)",
          background: "var(--background-primary)",
          color: "var(--text-normal)",
          fontSize: "13px",
          cursor: "pointer",
          width: "100%",
        });
        playStoreButton.addEventListener("click", () => {
          const playStoreLink = "https://play.google.com/store/apps/details?id=com.quim79.notelert";
          window.open(playStoreLink, "_blank");
        });

        return;
      }
      
      // Mostrar error detallado para otros errores
      const errContainer = listContainer.createEl("div");
      setCssProps(errContainer, {
        padding: "20px",
        textAlign: "center",
      });
      
      const errTitle = errContainer.createEl("div", {
        text: `${getTranslation(this.language, "common.error") || "Error"}: ${this.locationsError}`,
      });
      setCssProps(errTitle, {
        color: "var(--text-error)",
        fontSize: "14px",
        fontWeight: "600",
        marginBottom: "8px",
      });
      
      const errDesc = errContainer.createEl("div", {
        text: getTranslation(this.language, "datePicker.locationsErrorDesc") || 
          "Verifica que:\n1. El token sea correcto\n2. Tengas ubicaciones guardadas en la app\n3. Usa el botón 'Ver logs' para más detalles",
      });
      setCssProps(errDesc, {
        color: "var(--text-muted)",
        fontSize: "12px",
        lineHeight: "1.6",
        whiteSpace: "pre-line",
      });
      
      // Mostrar también en consola si debug está activado
      if (this.plugin.settings.debugMode) {
        console.error("[Notelert] Error cargando ubicaciones:", error);
      }
    } finally {
      this.locationsLoading = false;
      // Si el panel de debug está visible, actualizarlo
      if (this.showDebugPanel) {
        const container = document.querySelector('.notelert-datepicker-container');
        if (container instanceof HTMLElement) {
          this.renderDebugPanel(container);
        }
      }
    }
  }

  // Seleccionar ubicación de las guardadas
  private async selectLocationFromSaved(): Promise<SavedLocation | null> {
    return new Promise((resolve) => {
      void (async () => {
        try {
        // Crear modal primero para tener el área de debug disponible
        const modal = new Modal(this.app);
        modal.titleEl.setText(getTranslation(this.language, "datePicker.selectSavedLocation"));

        // Estilos responsive para el modal de selección - usar todo el ancho
        const { contentEl } = modal;
        contentEl.empty();
        setCssProps(contentEl, {
          minWidth: "300px",
          maxWidth: "600px",
          width: "95vw",
          maxHeight: "85vh",
          overflow: "hidden",
          padding: "20px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          margin: "0 auto",
        });

        // Asegurar que el modal tenga el z-index más alto
        const modalEl = (modal as Modal & { modalEl: HTMLElement }).modalEl;
        if (modalEl) {
          setCssProps(modalEl, {
            zIndex: '10000',
            position: 'fixed',
          });
        }

        // Área de debug/logs visible - CREAR PRIMERO
        const debugContainer = contentEl.createEl("div");
        setCssProps(debugContainer, {
          marginBottom: "15px",
          padding: "12px",
          background: "var(--background-secondary)",
          border: "2px solid var(--background-modifier-border)",
          borderRadius: "8px",
          fontSize: "11px",
          height: "150px",
          minHeight: "150px",
          maxHeight: "200px",
          overflowY: "auto",
          overflowX: "hidden",
          fontFamily: "'Courier New', monospace",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
          flexShrink: "0",
        } as Partial<CSSStyleDeclaration>);
        debugContainer.id = "location-select-debug-container";

        const header = debugContainer.createEl("div", {
          text: "🔍 Debug - Ubicaciones guardadas",
        });
        setCssProps(header, {
          fontWeight: "700",
          marginBottom: "8px",
          color: "var(--text-accent)",
          fontSize: "12px",
          borderBottom: "1px solid var(--background-modifier-border)",
          paddingBottom: "6px",
        } as Partial<CSSStyleDeclaration>);

        const debugInfoEl = debugContainer.createEl("div");
        debugInfoEl.id = "location-select-debug-info";
        setCssProps(debugInfoEl, {
          color: "var(--text-normal)",
          lineHeight: "1.6",
          wordWrap: "break-word",
          minHeight: "100px",
        } as Partial<CSSStyleDeclaration>);

        // Función para añadir logs
        const addLog = (message: string) => {
          const debugInfo = document.getElementById("location-select-debug-info");
          if (debugInfo) {
            const timestamp = new Date().toLocaleTimeString();
            const color = message.includes('❌') || message.includes('Error') ? 'var(--text-error)' :
              message.includes('✅') ? 'var(--text-success)' : 'var(--text-normal)';

            const line = debugInfo.createEl("div");
            setCssProps(line, {
              margin: "4px 0",
              padding: "4px 8px",
              fontSize: "11px",
              color,
              borderLeft: `3px solid ${color}`,
              background: "var(--background-secondary)",
              borderRadius: "3px",
              wordWrap: "break-word",
              whiteSpace: "pre-wrap",
            } as Partial<CSSStyleDeclaration>);
            line.textContent = `[${timestamp}] ${message}`;

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
        // Las ubicaciones ahora vienen de la API, no de settings
        const locations: SavedLocation[] = [];

        addLog(`📊 Ubicaciones encontradas: ${locations.length}`);
        addLog(`📋 Settings object: ${JSON.stringify(this.plugin.settings).substring(0, 200)}...`);

        if (locations.length > 0) {
          locations.forEach((loc, idx) => {
            addLog(`📍 [${idx + 1}] ${loc.name || 'Sin nombre'} - Lat: ${loc.latitude}, Lon: ${loc.longitude}`);
          });
        } else {
          addLog('❌ No se encontraron ubicaciones en la API');
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
            setCssProps(locationItem, { background: "var(--background-modifier-hover)" });
          });
          locationItem.addEventListener("mouseleave", () => {
            setCssProps(locationItem, { background: "var(--background-primary)" });
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
    })();
    });
  }

  // Crear notificación desde ubicación guardada
  // Retorna true si fue exitoso, false si hubo error
  private async createNotificationFromLocation(location: SavedLocation): Promise<boolean> {
    try {
      // Reemplazar el trigger con :#nombreUbicacion (siempre usamos :# para ubicaciones)
      const replacement = `:#${location.name}`;
      const line = this.editor.getLine(this.cursor.line);
      const beforeCursor = line.substring(0, this.cursor.ch - this.trigger.length); // Quitar el trigger
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
    setCssProps(button, {
      opacity: '0.6',
      cursor: 'not-allowed',
    });

    // Texto de carga sencillo
    button.textContent = getTranslation(this.language, "datePicker.confirmButton") || "Confirmando...";
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
    setCssProps(button, {
      opacity: '1',
      cursor: 'pointer',
    });
  }

  // Añadir feedback visual: reemplazar el trigger con icono de despertador y resaltar solo fecha/hora
  private addVisualFeedback(fullText: string, match: string) {
    try {
      // Extraer fecha y hora del match (escapar el trigger para regex)
      const escapedTrigger = this.trigger.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const matchParts = match.match(new RegExp(`${escapedTrigger}([^,]+),\\s*([^\\s]+)`));
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

