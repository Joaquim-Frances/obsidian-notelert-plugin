import { App, Modal, Notice } from "obsidian";
import { DetectedPattern } from "../core/types";
import { getTranslation } from "../i18n";
import { INotelertPlugin } from "../core/plugin-interface";

export class NotelertDatePickerModal extends Modal {
  private onCancel: () => void;
  private language: string;
  private plugin: INotelertPlugin;
  private editor: any;
  private cursor: any;
  private originalText: string;
  private notificationType: 'time' | 'location' = 'time'; // Tipo de notificación

  constructor(app: App, plugin: INotelertPlugin, language: string, editor: any, cursor: any, originalText: string, onCancel: () => void) {
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

    // Selector de tipo de notificación
    const typeContainer = container.createEl("div", { cls: "notelert-type-container" });
    typeContainer.setAttribute("style", "margin-bottom: 20px; padding: 12px; background: var(--background-secondary); border-radius: 6px;");
    
    const typeLabel = typeContainer.createEl("label", { 
      text: getTranslation(this.language, "datePicker.notificationType") || "Tipo de notificación:",
      attr: { style: "display: block; margin-bottom: 8px; font-weight: 500;" }
    });
    
    const typeButtonsContainer = typeContainer.createEl("div");
    typeButtonsContainer.setAttribute("style", "display: flex; gap: 8px;");
    
    const timeButton = typeButtonsContainer.createEl("button", {
      text: "⏰ " + (getTranslation(this.language, "datePicker.timeNotification") || "Tiempo"),
      cls: "mod-cta"
    });
    timeButton.setAttribute("style", "flex: 1; padding: 8px;");
    timeButton.id = "notification-type-time";
    
    const locationButton = typeButtonsContainer.createEl("button", {
      text: "📍 " + (getTranslation(this.language, "datePicker.locationNotification") || "Ubicación"),
      cls: "mod-secondary"
    });
    locationButton.setAttribute("style", "flex: 1; padding: 8px;");
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
      updateTypeButtons();
      this.updateModalContent(container, dateInput, timeInput);
    });
    
    locationButton.addEventListener("click", () => {
      this.notificationType = 'location';
      updateTypeButtons();
      this.updateModalContent(container, dateInput, timeInput);
    });
    
    updateTypeButtons();

    // Botones de acción rápida (solo para tipo 'time')
    const quickActions = container.createEl("div", { cls: "notelert-quick-actions" });
    quickActions.setAttribute("style", "margin-bottom: 20px;");
    quickActions.id = "quick-actions-container";
    
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
      if (this.notificationType === 'location') {
        // Para ubicación, mostrar lista de ubicaciones guardadas
        const selectedLocation = await this.selectLocationFromSaved();
        if (selectedLocation) {
          await this.createNotificationFromLocation(selectedLocation);
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
          await this.createNotificationFromDatePicker(date, time, newLine);
          
          this.close();
        } else {
          new Notice(getTranslation(this.language, "datePicker.selectDateTime"));
        }
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
        type: 'time'
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

  // Actualizar contenido del modal según el tipo de notificación
  private updateModalContent(container: HTMLElement, dateInput: HTMLInputElement, timeInput: HTMLInputElement) {
    const dateContainer = container.querySelector('.notelert-date-container');
    const timeContainer = container.querySelector('.notelert-time-container');
    const quickActions = container.querySelector('#quick-actions-container');
    
    if (this.notificationType === 'location') {
      // Ocultar fecha, hora y acciones rápidas para ubicación
      if (dateContainer) (dateContainer as HTMLElement).style.display = 'none';
      if (timeContainer) (timeContainer as HTMLElement).style.display = 'none';
      if (quickActions) (quickActions as HTMLElement).style.display = 'none';
    } else {
      // Mostrar fecha, hora y acciones rápidas para tiempo
      if (dateContainer) (dateContainer as HTMLElement).style.display = 'block';
      if (timeContainer) (timeContainer as HTMLElement).style.display = 'block';
      if (quickActions) (quickActions as HTMLElement).style.display = 'block';
    }
  }

  // Seleccionar ubicación de las guardadas
  private async selectLocationFromSaved(): Promise<any> {
    return new Promise((resolve) => {
      const locations = this.plugin.settings.savedLocations || [];
      
      if (locations.length === 0) {
        new Notice(getTranslation(this.language, "datePicker.noSavedLocations") || "No hay ubicaciones guardadas. Ve a Settings para añadir ubicaciones.");
        resolve(null);
        return;
      }

      // Crear modal simple para seleccionar ubicación
      const modal = new Modal(this.app);
      modal.titleEl.setText(getTranslation(this.language, "datePicker.selectSavedLocation") || "Seleccionar Ubicación");
      
      const { contentEl } = modal;
      contentEl.empty();
      
      locations.forEach((location) => {
        const locationItem = contentEl.createEl("div", {
          attr: {
            style: `
              padding: 12px;
              margin: 8px 0;
              border: 1px solid var(--background-modifier-border);
              border-radius: 6px;
              cursor: pointer;
              transition: background 0.2s;
            `
          }
        });
        
        locationItem.addEventListener("mouseenter", () => {
          locationItem.style.background = "var(--background-modifier-hover)";
        });
        locationItem.addEventListener("mouseleave", () => {
          locationItem.style.background = "";
        });
        
        locationItem.createEl("div", {
          text: location.name,
          attr: { style: "font-weight: 500; margin-bottom: 4px;" }
        });
        
        if (location.address) {
          locationItem.createEl("div", {
            text: location.address,
            attr: { style: "font-size: 12px; color: var(--text-muted);" }
          });
        }
        
        locationItem.addEventListener("click", () => {
          modal.close();
          resolve(location);
        });
      });
      
      modal.open();
    });
  }

  // Crear notificación desde ubicación guardada
  private async createNotificationFromLocation(location: any) {
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

      // Crear el patrón detectado
      const pattern: DetectedPattern = {
        text: newLine.trim(),
        title: this.extractTitleFromText(newLine, replacement),
        message: newLine.trim(),
        date: new Date().toISOString().split('T')[0],
        time: "00:00",
        fullMatch: replacement,
        startIndex: 0,
        endIndex: newLine.length,
        filePath: this.plugin.app.workspace.getActiveFile()?.path,
        lineNumber: this.cursor.line + 1,
        location: location.name,
        latitude: location.latitude,
        longitude: location.longitude,
        radius: location.radius,
        type: 'location'
      };

      // Crear la notificación directamente
      await this.plugin.createNotificationAndMarkProcessed(pattern);
      
      this.plugin.log(`Notificación de ubicación creada: ${pattern.title} en ${location.name}`);
    } catch (error) {
      this.plugin.log(`Error creando notificación de ubicación: ${error}`);
      new Notice(getTranslation(this.language, "notices.errorCreatingNotification", { title: "Recordatorio de ubicación" }));
    }
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

