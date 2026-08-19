import { App, Editor, EditorPosition, Modal, Notice, Platform } from "obsidian";
import { SavedLocation } from "../core/types";
import { getTranslation } from "../i18n";
import { INotelertPlugin } from "../core/plugin-interface";
import { setCssProps, isHTMLElement } from "../core/dom";
import { NotificationType } from "./date-picker/types";
import { getToday, isDateTimeInPast } from "./date-picker/utils/date-utils";
import { createNotificationFromDatePicker, createNotificationFromLocation } from "./date-picker/utils/notification-utils";
import { showLoadingState, hideLoadingState } from "./date-picker/utils/ui-helpers";
import { createDatePicker, DatePickerResult } from "./date-picker/components/DatePicker";
import { createTimePicker, TimePickerResult } from "./date-picker/components/TimePicker";
import { createQuickActions } from "./date-picker/components/QuickActions";
import { createTypeSelector, TypeSelectorResult } from "./date-picker/components/TypeSelector";
import { createDebugPanel, DebugPanelResult } from "./date-picker/components/DebugPanel";
import { createLocationList, LocationListResult } from "./date-picker/components/LocationList";
import { createRecurrenceSelector, RecurrenceSelectorResult } from "./date-picker/components/RecurrenceSelector";
import {
  createDeliveryChannelSelector,
  DeliveryChannelSelectorResult,
} from "./date-picker/components/DeliveryChannelSelector";
import { getCachedPremiumStatus, onPremiumStatusChange, PremiumStatus } from "../features/premium/premium-service";
import { createStripeCheckout } from "../features/premium/billing-api";
import { listScheduledReminders, ScheduledReminder } from "../features/notifications/reminders-api";

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
  private deliveryChannelSelector: DeliveryChannelSelectorResult | null = null;
  private container: HTMLElement | null = null;
  private premiumPanel: HTMLElement | null = null;
  private calendarPanel: HTMLElement | null = null;
  private scheduleTab: HTMLButtonElement | null = null;
  private premiumTab: HTMLButtonElement | null = null;
  private calendarTab: HTMLButtonElement | null = null;
  private actionButtons: HTMLElement | null = null;
  private isOpeningCheckout = false;
  private checkoutPollId = 0;
  private calendarMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  private scheduledReminders: ScheduledReminder[] = [];

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
      // Keep one stable canvas across every tab. The schedule tab can scroll,
      // but changing between it, Pro and Calendar must never resize the dialog.
      height: isDesktop ? "min(760px, calc(100vh - 48px))" : "90vh",
      maxHeight: isDesktop ? "calc(100vh - 48px)" : "90vh",
      overflow: "visible",
      padding: isDesktop ? "25px" : "20px",
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      margin: "0 auto",
    });

    // Contenedor con scroll interno
    const scrollContainer = contentEl.createDiv();
    setCssProps(scrollContainer, {
      flex: "1 1 auto",
      overflowY: "auto",
      overflowX: "hidden",
      paddingRight: "5px",
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

    const tabs = scrollContainer.createDiv({ cls: "notelert-modal-tabs" });
    this.scheduleTab = tabs.createEl("button", {
      text: getTranslation(this.language, "premiumPaywall.scheduleTab"),
      cls: "notelert-modal-tab is-active",
    });
    this.premiumTab = tabs.createEl("button", {
      text: "✦ " + getTranslation(this.language, "premiumPaywall.premiumTab"),
      cls: "notelert-modal-tab notelert-modal-tab-premium",
    });
    this.scheduleTab.addEventListener("click", () => this.setModalTab("schedule"));
    this.premiumTab.addEventListener("click", () => this.setModalTab("premium"));
    this.calendarTab = tabs.createEl("button", {
      text: "▦ " + getTranslation(this.language, "reminderCalendar.tab"),
      cls: "notelert-modal-tab",
    });
    this.calendarTab.addEventListener("click", () => this.setModalTab("calendar"));

    // Contenedor principal
    this.container = scrollContainer.createDiv({ cls: "notelert-datepicker-container" });
    setCssProps(this.container, {
      margin: "0",
      width: "100%",
      display: "block",
      visibility: "visible",
      minHeight: "200px", // Asegurar altura mínima
    });
    this.createPremiumPanel(scrollContainer);
    this.createCalendarPanel(scrollContainer);

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
    this.updatePremiumTabVisibility();
    // The calendar panel is created before the cached entitlement is applied.
    // Render it again so it uses the same Pro state as the reminder controls.
    this.renderCalendar();

    // Suscribirse a cambios de estado premium (por si aún está cargando)
    this.unsubscribePremium = onPremiumStatusChange((status: PremiumStatus) => {
      if (status.isPremium !== this.isPremium) {
        this.isPremium = status.isPremium;
        this.plugin.log(`🔄 Estado premium actualizado: ${this.isPremium}`);

        // Actualizar el RecurrenceSelector
        if (this.recurrenceSelector) {
          this.recurrenceSelector.updatePremiumStatus(this.isPremium);
        }
        this.deliveryChannelSelector?.updatePremiumStatus(this.isPremium);
        this.updatePremiumTabVisibility();
        this.renderCalendar();

        // Actualizar/Recargar lista de ubicaciones si existe
        if (this.locationList) {
          this.plugin.log("🔄 Recargando lista de ubicaciones tras actualización de premium");
          void this.locationList.reload();
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
          this.deliveryChannelSelector?.updateNotificationType(type);
          this.updateModalContent();
        }
      );
      this.plugin.log("TypeSelector creado");

      this.deliveryChannelSelector = createDeliveryChannelSelector(
        this.container,
        this.language,
        this.plugin.settings.deliveryChannels || ["push"],
        this.notificationType,
        this.isPremium,
        () => this.showChannelPremiumPaywall()
      );

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
      const recurrenceAndroidOnly = this.container.createDiv({
        text: getTranslation(this.language, "recurrence.androidOnly"),
        cls: "notelert-recurrence-android-only",
      });
      setCssProps(recurrenceAndroidOnly, {
        marginTop: "-8px",
        color: "var(--text-muted)",
        fontSize: "12px",
        lineHeight: "1.4",
      });
      this.plugin.log(`SUCCESS RecurrenceSelector creado: ${this.recurrenceSelector ? 'OK' : 'NULL'}`);

      // Panel de debug
      if (!isDesktop) {
        this.debugPanel = createDebugPanel(
          this.container,
          this.language,
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
    const iconEl = content.createDiv({ text: "🔄✨" });
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
    const buttonContainer = content.createDiv();
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

  private createPremiumPanel(parent: HTMLElement): void {
    this.premiumPanel = parent.createDiv({ cls: "notelert-premium-paywall" });
    this.premiumPanel.hide();
    this.renderPremiumPanel();
  }

  private renderPremiumPanel(): void {
    if (!this.premiumPanel) return;
    this.premiumPanel.empty();
    const panel = this.premiumPanel;
    panel.createDiv({ text: "NOTELERT PRO", cls: "notelert-premium-eyebrow" });
    panel.createEl("h3", { text: getTranslation(this.language, "premiumPaywall.title") });
    panel.createEl("p", {
      text: getTranslation(this.language, "premiumPaywall.description"),
      cls: "notelert-premium-lede",
    });

    const features = panel.createDiv({ cls: "notelert-premium-features" });
    ["channels", "reminders", "recurrence", "location"].forEach(key => {
      const feature = features.createDiv({ cls: "notelert-premium-feature" });
      feature.createSpan({ text: "✓", cls: "notelert-premium-check" });
      feature.createSpan({ text: getTranslation(this.language, `premiumPaywall.features.${key}`) });
    });

    const plans = panel.createDiv({ cls: "notelert-premium-plans" });
    this.createCheckoutPlan(plans, "monthly", getTranslation(this.language, "premiumPaywall.monthly"), "3,99 € / mes");
    this.createCheckoutPlan(plans, "yearly", getTranslation(this.language, "premiumPaywall.yearly"), "39,99 € / año", true);
  }

  private createCheckoutPlan(parent: HTMLElement, period: "monthly" | "yearly", title: string, price: string, recommended = false): void {
    const plan = parent.createDiv({ cls: `notelert-premium-plan${recommended ? " is-recommended" : ""}` });
    if (recommended) plan.createDiv({ text: getTranslation(this.language, "premiumPaywall.bestValue"), cls: "notelert-premium-best-value" });
    const copy = plan.createDiv();
    copy.createDiv({ text: title, cls: "notelert-premium-plan-title" });
    copy.createDiv({ text: price, cls: "notelert-premium-price" });
    const button = plan.createEl("button", {
      text: this.isOpeningCheckout ? getTranslation(this.language, "premiumPaywall.opening") : getTranslation(this.language, "premiumPaywall.choose"),
      cls: recommended ? "mod-cta" : "mod-secondary",
    });
    button.disabled = this.isOpeningCheckout;
    button.addEventListener("click", () => void this.openStripeCheckout(period));
  }

  private showChannelPremiumPaywall(): void {
    new Notice(getTranslation(this.language, "premiumPaywall.channelLimit"), 6000);
    this.setModalTab("premium");
  }

  private createCalendarPanel(parent: HTMLElement): void {
    this.calendarPanel = parent.createDiv({ cls: "notelert-reminder-calendar" });
    this.calendarPanel.hide();
    this.renderCalendar();
  }

  private async loadCalendarReminders(): Promise<void> {
    const token = this.plugin.settings.pluginToken?.trim();
    if (!token) return;
    try {
      this.scheduledReminders = await listScheduledReminders(token);
      this.renderCalendar();
    } catch (error) {
      this.plugin.log(`No se pudieron cargar los recordatorios: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private renderCalendar(): void {
    if (!this.calendarPanel) return;
    const panel = this.calendarPanel;
    panel.empty();
    panel.createEl("h3", { text: getTranslation(this.language, "reminderCalendar.title") });
    panel.createEl("p", { text: getTranslation(this.language, "reminderCalendar.description"), cls: "notelert-calendar-description" });
    const nav = panel.createDiv({ cls: "notelert-calendar-nav" });
    const previous = nav.createEl("button", { text: "←", cls: "mod-secondary" });
    nav.createDiv({ text: this.calendarMonth.toLocaleDateString(this.language, { month: "long", year: "numeric" }) });
    const next = nav.createEl("button", { text: "→", cls: "mod-secondary" });
    previous.addEventListener("click", () => { this.calendarMonth.setMonth(this.calendarMonth.getMonth() - 1); this.renderCalendar(); });
    next.addEventListener("click", () => { this.calendarMonth.setMonth(this.calendarMonth.getMonth() + 1); this.renderCalendar(); });

    const viewport = panel.createDiv({ cls: `notelert-calendar-viewport${this.isPremium ? "" : " is-locked"}` });
    const grid = viewport.createDiv({ cls: "notelert-calendar-grid" });
    ["L", "M", "X", "J", "V", "S", "D"].forEach(day => grid.createDiv({ text: day, cls: "notelert-calendar-weekday" }));
    const firstDay = (this.calendarMonth.getDay() + 6) % 7;
    const daysInMonth = new Date(this.calendarMonth.getFullYear(), this.calendarMonth.getMonth() + 1, 0).getDate();
    for (let i = 0; i < firstDay; i++) grid.createDiv({ cls: "notelert-calendar-day is-empty" });
    for (let day = 1; day <= daysInMonth; day++) {
      const today = new Date();
      const isToday = today.getFullYear() === this.calendarMonth.getFullYear()
        && today.getMonth() === this.calendarMonth.getMonth()
        && today.getDate() === day;
      const cell = grid.createDiv({ cls: `notelert-calendar-day${isToday ? " is-today" : ""}` });
      cell.createDiv({ text: String(day), cls: "notelert-calendar-date" });
      const reminders = this.scheduledReminders.filter(reminder => {
        const date = new Date(reminder.scheduledDate);
        return date.getFullYear() === this.calendarMonth.getFullYear() && date.getMonth() === this.calendarMonth.getMonth() && date.getDate() === day;
      });
      reminders.slice(0, 2).forEach(reminder => cell.createDiv({ text: reminder.title, cls: "notelert-calendar-event" }));
    }
    if (!this.isPremium) {
      const lock = viewport.createDiv({ cls: "notelert-calendar-lock" });
      lock.createDiv({ text: "✦", cls: "notelert-calendar-lock-icon" });
      lock.createEl("strong", { text: getTranslation(this.language, "reminderCalendar.proTitle") });
      lock.createSpan({ text: getTranslation(this.language, "reminderCalendar.proDescription") });
    }
  }

  private setModalTab(tab: "schedule" | "premium" | "calendar"): void {
    if (tab === "premium" && this.isPremium) tab = "schedule";
    const premiumActive = tab === "premium";
    const calendarActive = tab === "calendar";
    this.container?.toggle(!premiumActive && !calendarActive);
    this.premiumPanel?.toggle(premiumActive);
    this.calendarPanel?.toggle(calendarActive);
    this.actionButtons?.toggle(!premiumActive && !calendarActive);
    this.scheduleTab?.classList.toggle("is-active", !premiumActive && !calendarActive);
    this.premiumTab?.classList.toggle("is-active", premiumActive);
    this.calendarTab?.classList.toggle("is-active", calendarActive);
    if (calendarActive) void this.loadCalendarReminders();
  }

  private updatePremiumTabVisibility(): void {
    if (!this.premiumTab) return;
    this.premiumTab.toggle(!this.isPremium);
    if (this.isPremium) this.setModalTab("schedule");
  }

  private async openStripeCheckout(period: "monthly" | "yearly"): Promise<void> {
    const token = this.plugin.settings.pluginToken?.trim();
    if (!token) {
      new Notice(getTranslation(this.language, "premiumPaywall.tokenRequired"), 8000);
      return;
    }
    const checkoutWindow = Platform.isMobile ? null : window.open("about:blank", "_blank");
    this.isOpeningCheckout = true;
    this.renderPremiumPanel();
    try {
      const url = await createStripeCheckout(token, period, this.language, this.app.vault.getName());
      if (checkoutWindow && !checkoutWindow.closed) {
        checkoutWindow.location.href = url;
      } else if (Platform.isMobile) {
        // `_system` is handled by Obsidian/Cordova as an external browser. A
        // regular `_blank` after an async request is silently ignored on
        // Android because it is no longer considered a direct user gesture.
        window.open(url, "_system");
      } else {
        window.open(url, "_blank");
      }
      void this.pollPremiumAfterCheckout(++this.checkoutPollId, 45);
    } catch (error) {
      checkoutWindow?.close();
      new Notice(error instanceof Error ? error.message : String(error), 10000);
    } finally {
      this.isOpeningCheckout = false;
      this.renderPremiumPanel();
    }
  }

  private async pollPremiumAfterCheckout(pollId: number, attempts: number): Promise<void> {
    if (pollId !== this.checkoutPollId || attempts <= 0) return;
    try {
      const { getPremiumStatus } = await import("../features/premium/premium-service");
      const status = await getPremiumStatus(this.plugin.settings.pluginToken, true);
      if (status.isPremium) {
        this.isPremium = true;
        this.deliveryChannelSelector?.updatePremiumStatus(true);
        new Notice(getTranslation(this.language, "premiumPaywall.activated"), 6000);
        this.setModalTab("schedule");
        return;
      }
    } catch (error) {
      this.plugin.log(`No se pudo refrescar Premium tras Checkout: ${error instanceof Error ? error.message : String(error)}`);
    }
    window.setTimeout(() => void this.pollPremiumAfterCheckout(pollId, attempts - 1), 2000);
  }

  private createActionButtons(parent: HTMLElement) {
    const buttonContainer = parent.createDiv({ cls: "notelert-datepicker-buttons" });
    this.actionButtons = buttonContainer;
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

    const confirmButton: HTMLButtonElement = buttonContainer.createEl("button", {
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
          const selectedChannels =
            this.deliveryChannelSelector?.getSelectedChannels() || [];
          if (
            this.notificationType === "location" &&
            !selectedChannels.includes("push")
          ) {
            hideLoadingState(confirmButton, this.language);
            new Notice(
              getTranslation(this.language, "notices.locationRequiresPush"),
              10000
            );
            return;
          }
          if (selectedChannels.length === 0) {
            hideLoadingState(confirmButton, this.language);
            new Notice(
              getTranslation(this.language, "notices.deliveryRequired"),
              10000
            );
            return;
          }

          if (this.notificationType === 'location') {
            if (!this.selectedLocation) {
              hideLoadingState(confirmButton, this.language);
              new Notice(getTranslation(this.language, "datePicker.selectLocationRequired"), 10000);
              return;
            }
            const success = await createNotificationFromLocation(
              this.plugin,
              this.editor,
              this.cursor,
              this.trigger,
              this.selectedLocation,
              this.language,
              selectedChannels
            );
            hideLoadingState(confirmButton, this.language);
            if (success) {
              await this.loadCalendarReminders();
              this.close();
            }
          } else {
            if (!this.datePicker || !this.timePicker) {
              hideLoadingState(confirmButton, this.language);
              new Notice(getTranslation(this.language, "datePicker.selectDateTime"), 10000);
              return;
            }

            const date: string = this.datePicker.dateInput.value;
            const time: string = this.timePicker.timeInput.value;

            if (date && time) {
              if (isDateTimeInPast(date, time)) {
                hideLoadingState(confirmButton, this.language);
                new Notice(getTranslation(this.language, "datePicker.pastDateTime"), 10000);
                return;
              }

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
              if (recurrenceConfig?.enabled && !selectedChannels.includes("push")) {
                hideLoadingState(confirmButton, this.language);
                new Notice(getTranslation(this.language, "recurrence.androidOnly"), 10000);
                return;
              }

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
                recurrenceConfig,
                recurrenceConfig?.enabled ? ["push"] : selectedChannels
              );

              hideLoadingState(confirmButton, this.language);
              if (success) {
                await this.loadCalendarReminders();
                this.close();
              }
            } else {
              hideLoadingState(confirmButton, this.language);
              new Notice(getTranslation(this.language, "datePicker.selectDateTime"), 10000);
            }
          }
        } catch (err) {
          hideLoadingState(confirmButton, this.language);
          const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
          this.plugin.log(`Error en confirmación: ${errorMessage}`);
          new Notice(`Error: ${errorMessage}`, 10000);
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
    this.deliveryChannelSelector = null;
    this.premiumPanel = null;
    this.scheduleTab = null;
    this.premiumTab = null;
    this.actionButtons = null;
    this.checkoutPollId++;
  }
}
