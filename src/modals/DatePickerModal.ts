import { App, Editor, EditorPosition, Modal, Notice, Platform } from "obsidian";
import { SavedLocation } from "../core/types";
import { getTranslation } from "../i18n";
import { INotelertPlugin } from "../core/plugin-interface";
import { setCssProps, isHTMLElement } from "../core/dom";
import { NotificationType } from "./date-picker/types";
import { getToday } from "./date-picker/utils/date-utils";
import { createNotificationFromDatePicker, createNotificationFromLocation } from "./date-picker/utils/notification-utils";
import { showLoadingState, hideLoadingState } from "./date-picker/utils/ui-helpers";
import { createDatePicker, DatePickerResult } from "./date-picker/components/DatePicker";
import { createTimePicker, TimePickerResult } from "./date-picker/components/TimePicker";
import { createQuickActions } from "./date-picker/components/QuickActions";
import { createTypeSelector, TypeSelectorResult } from "./date-picker/components/TypeSelector";
import { createDebugPanel, DebugPanelResult } from "./date-picker/components/DebugPanel";
import { createLocationList, LocationListResult } from "./date-picker/components/LocationList";
import { createRecurrenceSelector, RecurrenceSelectorResult, RecurrenceConfig } from "./date-picker/components/RecurrenceSelector";
import { getCachedPremiumStatus, onPremiumStatusChange, PremiumStatus } from "../features/premium/premium-service";

export class NotelertDatePickerModal extends Modal {
  private onCancel: () => void;
  private language: string;
  private plugin: INotelertPlugin;
  private editor: Editor;
  private cursor: EditorPosition;
  private originalText: string;
  private notificationType: NotificationType = 'time';
  private selectedLocation: SavedLocation | null = null;
  private showDebugPanel: boolean = false;
  private trigger: string;

  // Componentes UI
  private datePicker: DatePickerResult | null = null;
  private timePicker: TimePickerResult | null = null;
  private quickActions: { container: HTMLElement } | null = null;
  private typeSelector: TypeSelectorResult | null = null;
  private debugPanel: DebugPanelResult | null = null;
  private locationList: LocationListResult | null = null;
  private recurrenceSelector: RecurrenceSelectorResult | null = null;
  private container: HTMLElement | null = null;
  
  // Estado premium
  private isPremium: boolean = false;
  private unsubscribePremium: (() => void) | null = null;

  constructor(
    app: App,
    plugin: INotelertPlugin,
    language: string,
    editor: Editor,
    cursor: EditorPosition,
    originalText: string,
    trigger: string,
    onCancel: () => void
  ) {
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

    // Estilos responsive para el modal
    setCssProps(contentEl, {
      minWidth: isDesktop ? "400px" : "300px",
      maxWidth: isDesktop ? "500px" : "600px",
      width: isDesktop ? "auto" : "95vw",
      maxHeight: isDesktop ? "auto" : "90vh",
      overflow: "visible",
      padding: isDesktop ? "25px" : "20px",
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      margin: "0 auto",
    });

    // Contenedor con scroll interno
    const scrollContainer = contentEl.createEl("div");
    setCssProps(scrollContainer, {
      flex: "1 1 auto",
      overflowY: isDesktop ? "visible" : "auto",
      overflowX: "hidden",
      paddingRight: isDesktop ? "0" : "5px",
      marginBottom: "10px",
      minHeight: "0",
    });

    const titleEl = scrollContainer.createEl("h2", {
      text: getTranslation(this.language, "datePicker.title"),
    });
    setCssProps(titleEl, {
      margin: "0 0 15px 0",
      fontSize: "18px",
      fontWeight: "600",
    });

    // Contenedor principal
    this.container = scrollContainer.createEl("div", { cls: "notelert-datepicker-container" });
    setCssProps(this.container, {
      margin: "0",
      width: "100%",
      display: "block",
      visibility: "visible",
      minHeight: "200px", // Asegurar altura mínima
    });
    
    // Debug: verificar que el contenedor se creó
    this.plugin.log(`Container creado: ${this.container ? 'OK' : 'NULL'}`);
    this.plugin.log(`Container parent: ${this.container?.parentElement ? 'OK' : 'NULL'}`);

    // En desktop, forzar tipo 'time'
    if (isDesktop) {
      this.notificationType = 'time';
    }

    // Obtener estado premium precargado (instantáneo)
    const cachedStatus = getCachedPremiumStatus();
    this.isPremium = cachedStatus.isPremium;
    this.plugin.log(`📌 Estado premium precargado: ${this.isPremium} (loading: ${cachedStatus.loading})`);

    // Suscribirse a cambios de estado premium (por si aún está cargando)
    this.unsubscribePremium = onPremiumStatusChange((status: PremiumStatus) => {
      if (status.isPremium !== this.isPremium) {
        this.isPremium = status.isPremium;
        this.plugin.log(`🔄 Estado premium actualizado: ${this.isPremium}`);
        
        // Actualizar el RecurrenceSelector
        if (this.recurrenceSelector) {
          this.recurrenceSelector.updatePremiumStatus(this.isPremium);
        }
      }
    });

    // Crear componentes con el estado premium actual
    this.createComponents(isDesktop);

    // Botones principales
    this.createActionButtons(contentEl);
  }

  private createComponents(isDesktop: boolean) {
    if (!this.container) {
      this.plugin.log("Error: container es null en createComponents");
      return;
    }

    try {
      this.plugin.log(`Creando componentes para desktop: ${isDesktop}`);

      // Selector de tipo (tiempo/ubicación)
      this.typeSelector = createTypeSelector(
        this.container,
        this.language,
        isDesktop,
        this.notificationType,
        (type: NotificationType) => {
          this.notificationType = type;
          this.selectedLocation = null;
          this.updateModalContent();
        }
      );
      this.plugin.log("TypeSelector creado");

      // Botón para mostrar/ocultar logs de debug (solo en móvil)
      if (!isDesktop) {
        const debugToggleContainer = this.container.createEl("div");
        setCssProps(debugToggleContainer, {
          marginBottom: "10px",
          display: "flex",
          justifyContent: "flex-end",
        });

        const debugToggleBtn = debugToggleContainer.createEl("button", {
          text: "Ver logs",
          cls: "mod-secondary"
        });
        setCssProps(debugToggleBtn, {
          padding: "6px 12px",
          fontSize: "12px",
        });

        debugToggleBtn.addEventListener("click", () => {
          this.showDebugPanel = !this.showDebugPanel;
          this.updateDebugPanel();
          debugToggleBtn.textContent = this.showDebugPanel ? "Ocultar logs" : "Ver logs";
        });
      }

      // Selector de fecha
      this.plugin.log("Creando DatePicker...");
      this.datePicker = createDatePicker(
        this.container,
        this.language,
        getToday()
      );
      this.plugin.log(`DatePicker creado: ${this.datePicker ? 'OK' : 'NULL'}`);

      // Selector de hora
      this.plugin.log("🔧 Creando TimePicker...");
      this.timePicker = createTimePicker(
        this.container,
        this.language,
        isDesktop
      );
      this.plugin.log(`SUCCESS TimePicker creado: ${this.timePicker ? 'OK' : 'NULL'}`);

      // Acciones rápidas
      this.plugin.log("🔧 Creando QuickActions...");
      this.quickActions = createQuickActions(
        this.container,
        this.language,
        (date: string, time: string) => {
          if (this.datePicker) {
            this.datePicker.dateInput.value = date;
          }
          if (this.timePicker) {
            this.timePicker.timeInput.value = time;
            const [hours, minutes] = time.split(':').map(Number);
            this.timePicker.updateTime(hours, minutes);
          }
        }
      );
      this.plugin.log(`SUCCESS QuickActions creado: ${this.quickActions ? 'OK' : 'NULL'}`);

      // Selector de recurrencia
      this.plugin.log("🔧 Creando RecurrenceSelector...");
      this.recurrenceSelector = createRecurrenceSelector(
        this.container,
        this.language,
        (enabled: boolean) => {
          this.plugin.log(`Recurrencia ${enabled ? 'activada' : 'desactivada'}`);
        },
        () => {
          // Callback cuando se requiere premium
          this.showPremiumRequiredModal();
        },
        this.isPremium
      );
      this.plugin.log(`SUCCESS RecurrenceSelector creado: ${this.recurrenceSelector ? 'OK' : 'NULL'}`);

      // Panel de debug
      if (!isDesktop) {
        this.debugPanel = createDebugPanel(
          this.container,
          (message: string) => {
            this.plugin.log(message);
          }
        );
        if (!this.showDebugPanel) {
          setCssProps(this.debugPanel.container, { display: 'none' });
        }
      }

      // Verificar que los elementos están en el DOM ANTES de updateModalContent
      const dateContainer = this.container.querySelector('.notelert-date-container');
      const timeContainer = this.container.querySelector('.notelert-time-container');
      const quickActionsContainer = this.container.querySelector('#quick-actions-container');
      
      this.plugin.log(`DEBUG Verificación DOM ANTES de updateModalContent:`);
      this.plugin.log(`  - DateContainer: ${dateContainer ? 'ENCONTRADO' : 'NO ENCONTRADO'}`);
      this.plugin.log(`  - TimeContainer: ${timeContainer ? 'ENCONTRADO' : 'NO ENCONTRADO'}`);
      this.plugin.log(`  - QuickActions: ${quickActionsContainer ? 'ENCONTRADO' : 'NO ENCONTRADO'}`);
      
      // Asegurar que los elementos están visibles ANTES de llamar a updateModalContent
      if (dateContainer && isHTMLElement(dateContainer)) {
        setCssProps(dateContainer, { display: 'block', visibility: 'visible', opacity: '1' });
      }
      if (timeContainer && isHTMLElement(timeContainer)) {
        setCssProps(timeContainer, { display: 'block', visibility: 'visible', opacity: '1' });
      }
      if (quickActionsContainer && isHTMLElement(quickActionsContainer)) {
        setCssProps(quickActionsContainer, { display: 'block', visibility: 'visible', opacity: '1' });
      }

      // Actualizar contenido según tipo (esto solo debería ocultar/mostrar según notificationType)
      this.updateModalContent();
      
      // Verificar DESPUÉS de updateModalContent
      const dateContainerAfter = this.container.querySelector('.notelert-date-container');
      const timeContainerAfter = this.container.querySelector('.notelert-time-container');
      const quickActionsContainerAfter = this.container.querySelector('#quick-actions-container');
      
      this.plugin.log(`DEBUG Verificación DOM DESPUÉS de updateModalContent:`);
      this.plugin.log(`  - DateContainer display: ${dateContainerAfter ? (dateContainerAfter as HTMLElement).style.display : 'NULL'}`);
      this.plugin.log(`  - TimeContainer display: ${timeContainerAfter ? (timeContainerAfter as HTMLElement).style.display : 'NULL'}`);
      this.plugin.log(`  - QuickActions display: ${quickActionsContainerAfter ? (quickActionsContainerAfter as HTMLElement).style.display : 'NULL'}`);
      
      this.plugin.log("SUCCESS Componentes creados y actualizados");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.plugin.log(`FAIL Error creando componentes: ${errorMessage}`);
      console.error("Error en createComponents:", error);
    }
  }

  private updateModalContent() {
    if (!this.container) return;

    const dateContainer = this.container.querySelector('.notelert-date-container');
    const timeContainer = this.container.querySelector('.notelert-time-container');
    const quickActions = this.container.querySelector('#quick-actions-container');
    const recurrenceContainer = this.container.querySelector('.notelert-recurrence-container');
    const locationListContainer = this.container.querySelector('#location-list-container');
    const debugPanel = this.container.querySelector('#debug-panel-container');

    if (this.notificationType === 'location') {
      // Ocultar fecha, hora, acciones rápidas y recurrencia
      if (isHTMLElement(dateContainer)) setCssProps(dateContainer, { display: 'none', visibility: 'hidden' });
      if (isHTMLElement(timeContainer)) setCssProps(timeContainer, { display: 'none', visibility: 'hidden' });
      if (isHTMLElement(quickActions)) setCssProps(quickActions, { display: 'none', visibility: 'hidden' });
      if (isHTMLElement(recurrenceContainer)) setCssProps(recurrenceContainer, { display: 'none', visibility: 'hidden' });

      // Mostrar o crear la lista de ubicaciones
      if (!locationListContainer) {
        void this.createLocationList();
      } else if (isHTMLElement(locationListContainer)) {
        setCssProps(locationListContainer, { display: 'block', visibility: 'visible' });
      }
    } else {
      // Mostrar fecha, hora, acciones rápidas y recurrencia
      if (isHTMLElement(dateContainer)) {
        setCssProps(dateContainer, { 
          display: 'block', 
          visibility: 'visible',
          opacity: '1'
        });
      }
      if (isHTMLElement(timeContainer)) {
        setCssProps(timeContainer, { 
          display: 'block', 
          visibility: 'visible',
          opacity: '1'
        });
      }
      if (isHTMLElement(quickActions)) {
        setCssProps(quickActions, { 
          display: 'block', 
          visibility: 'visible',
          opacity: '1'
        });
      }
      if (isHTMLElement(recurrenceContainer)) {
        setCssProps(recurrenceContainer, { 
          display: 'block', 
          visibility: 'visible',
          opacity: '1'
        });
      }

      // Ocultar lista de ubicaciones
      if (isHTMLElement(locationListContainer)) {
        setCssProps(locationListContainer, { display: 'none', visibility: 'hidden' });
      }
    }

    // Mantener el panel de debug visible si estaba visible
    if (this.showDebugPanel && isHTMLElement(debugPanel)) {
      setCssProps(debugPanel, { display: 'block', visibility: 'visible' });
    } else if (this.showDebugPanel && !debugPanel && this.debugPanel) {
      setCssProps(this.debugPanel.container, { display: 'block', visibility: 'visible' });
    }
  }

  private async createLocationList() {
    if (!this.container) return;

    // Eliminar lista anterior si existe
    const existingList = this.container.querySelector('#location-list-container');
    if (existingList) {
      existingList.remove();
    }

    this.locationList = await createLocationList(
      this.container,
      this.language,
      this.plugin,
      (location: SavedLocation | null) => {
        this.selectedLocation = location;
      },
      (message: string) => {
        if (this.debugPanel) {
          this.debugPanel.addLog(message);
        }
        this.plugin.log(message);
      }
    );
  }

  private updateDebugPanel() {
    if (!this.debugPanel) return;
    setCssProps(this.debugPanel.container, {
      display: this.showDebugPanel ? 'block' : 'none'
    });
  }

  private showPremiumRequiredModal() {
    // Crear modal de premium requerido
    const modal = new Modal(this.app);
    modal.titleEl.setText(getTranslation(this.language, "recurrence.premiumRequired") || "Premium Required");
    
    const content = modal.contentEl;
    setCssProps(content, {
      padding: "20px",
      textAlign: "center",
    });

    // Icono
    const iconEl = content.createEl("div", { text: "🔄✨" });
    setCssProps(iconEl, {
      fontSize: "48px",
      marginBottom: "15px",
    });

    // Descripción
    const descEl = content.createEl("p", {
      text: getTranslation(this.language, "recurrence.premiumRequiredDesc") || 
            "Upgrade to Premium to create reminders that repeat automatically.",
    });
    setCssProps(descEl, {
      marginBottom: "20px",
      color: "var(--text-muted)",
      lineHeight: "1.5",
    });

    // Botones
    const buttonContainer = content.createEl("div");
    setCssProps(buttonContainer, {
      display: "flex",
      gap: "10px",
      justifyContent: "center",
      flexWrap: "wrap",
    });

    const openAppButton = buttonContainer.createEl("button", {
      text: getTranslation(this.language, "recurrence.openApp") || "📱 Open app to upgrade",
      cls: "mod-cta",
    });
    setCssProps(openAppButton, {
      padding: "10px 20px",
    });
    openAppButton.addEventListener("click", () => {
      // Abrir la app de Notelert (deep link)
      window.open("notelert://premium", "_blank");
      modal.close();
    });

    const cancelButton = buttonContainer.createEl("button", {
      text: getTranslation(this.language, "datePicker.cancelButton") || "Cancel",
      cls: "mod-secondary",
    });
    setCssProps(cancelButton, {
      padding: "10px 20px",
    });
    cancelButton.addEventListener("click", () => {
      modal.close();
    });

    modal.open();
  }

  private createActionButtons(parent: HTMLElement) {
    const buttonContainer = parent.createEl("div", { cls: "notelert-datepicker-buttons" });
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
      showLoadingState(confirmButton, this.language);

      void (async () => {
        try {
          if (this.notificationType === 'location') {
            if (!this.selectedLocation) {
              hideLoadingState(confirmButton, this.language);
              new Notice(getTranslation(this.language, "datePicker.selectSavedLocation") || "Por favor, selecciona una ubicación");
              return;
            }
            const success = await createNotificationFromLocation(
              this.plugin,
              this.editor,
              this.cursor,
              this.trigger,
              this.selectedLocation,
              this.language
            );
            hideLoadingState(confirmButton, this.language);
            if (success) {
              this.close();
            }
          } else {
            if (!this.datePicker || !this.timePicker) {
              hideLoadingState(confirmButton, this.language);
              new Notice(getTranslation(this.language, "datePicker.selectDateTime"));
              return;
            }

            const date = this.datePicker.dateInput.value;
            const time = this.timePicker.timeInput.value;

            if (date && time) {
              // Reemplazar el trigger con trigger+fecha, hora
              const replacement = `${this.trigger}${date}, ${time}`;
              const line = this.editor.getLine(this.cursor.line);
              const beforeCursor = line.substring(0, this.cursor.ch - this.trigger.length);
              const afterCursor = line.substring(this.cursor.ch);
              const newLine = beforeCursor + replacement + afterCursor;

              this.editor.setLine(this.cursor.line, newLine);

              // Mover cursor al final del reemplazo
              const newCursor = {
                line: this.cursor.line,
                ch: beforeCursor.length + replacement.length
              };
              this.editor.setCursor(newCursor);

              // Obtener configuración de recurrencia
              const recurrenceConfig = this.recurrenceSelector?.getConfig();

              // Crear la notificación
              const success = await createNotificationFromDatePicker(
                this.plugin,
                this.editor,
                this.cursor,
                this.trigger,
                date,
                time,
                newLine,
                this.language,
                recurrenceConfig
              );

              hideLoadingState(confirmButton, this.language);
              if (success) {
                this.close();
              }
            } else {
              hideLoadingState(confirmButton, this.language);
              new Notice(getTranslation(this.language, "datePicker.selectDateTime"));
            }
          }
        } catch (err) {
          hideLoadingState(confirmButton, this.language);
          const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
          this.plugin.log(`Error en confirmación: ${errorMessage}`);
          new Notice(`Error: ${errorMessage}`);
        }
      })();
    });
  }

  onClose() {
    // Desuscribirse de cambios de premium
    if (this.unsubscribePremium) {
      this.unsubscribePremium();
      this.unsubscribePremium = null;
    }
    
    const { contentEl } = this;
    contentEl.empty();
    this.container = null;
    this.datePicker = null;
    this.timePicker = null;
    this.quickActions = null;
    this.typeSelector = null;
    this.debugPanel = null;
    this.locationList = null;
    this.recurrenceSelector = null;
  }
}
