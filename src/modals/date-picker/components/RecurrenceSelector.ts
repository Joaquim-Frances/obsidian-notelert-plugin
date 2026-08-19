/**
 * Componente para seleccionar recurrencia de notificaciones
 */

import { getTranslation } from "../../../i18n";
import { setCssProps, createDiv, createEl, createSpan, setElementId } from "../../../core/dom";

export type RecurrenceUnit = 'day' | 'week' | 'month' | 'year';
export type RecurrenceEndType = 'never' | 'count' | 'date';

export interface RecurrenceConfig {
  enabled: boolean;
  interval: number;
  unit: RecurrenceUnit;
  endType: RecurrenceEndType;
  endCount?: number;
  endDate?: string;
}

export interface RecurrenceSelectorResult {
  container: HTMLElement;
  getConfig: () => RecurrenceConfig;
  setEnabled: (enabled: boolean) => void;
  isEnabled: () => boolean;
  updatePremiumStatus: (isPremium: boolean) => void;
}

/**
 * Crea el componente selector de recurrencia
 */
export function createRecurrenceSelector(
  parent: HTMLElement,
  language: string,
  onToggle: (enabled: boolean) => void,
  onPremiumRequired: () => void,
  isPremium: boolean
): RecurrenceSelectorResult {
  let premiumAccess = isPremium;
  let config: RecurrenceConfig = {
    enabled: false,
    interval: 1,
    unit: 'day',
    endType: 'never',
    endCount: 10,
    endDate: undefined,
  };

  // Contenedor principal
  const container = createDiv(parent, { cls: "notelert-recurrence-container" });
  setCssProps(container, {
    marginTop: "15px",
    padding: "15px",
    background: "var(--background-secondary)",
    borderRadius: "8px",
    width: "100%",
    boxSizing: "border-box",
  });

  // Toggle de recurrencia
  const toggleContainer = createDiv(container, { cls: "notelert-recurrence-toggle" });
  setCssProps(toggleContainer, {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    cursor: premiumAccess ? "pointer" : "not-allowed",
    opacity: premiumAccess ? "1" : "0.7",
  });

  const toggleLabel = createEl(toggleContainer, "label", {
    text: getTranslation(language, "recurrence.repeatLabel") || "Repetir",
  });
  setCssProps(toggleLabel, {
    fontWeight: "500",
    fontSize: "14px",
    cursor: premiumAccess ? "pointer" : "not-allowed",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  });

  const toggleCheckbox = createEl(toggleContainer, "input", { type: "checkbox" });
  setElementId(toggleCheckbox, "recurrence-toggle");
  toggleCheckbox.disabled = !premiumAccess;
  setCssProps(toggleCheckbox, {
    width: "18px",
    height: "18px",
    cursor: premiumAccess ? "pointer" : "not-allowed",
  });

  // Mensaje de premium requerido (solo si no es premium)
  let premiumMessage: HTMLElement | null = null;
  if (!isPremium) {
    premiumMessage = createDiv(container, {
      text: getTranslation(language, "recurrence.premiumHint") || "⭐ Actualiza a Premium para usar notificaciones recurrentes",
    });
    setCssProps(premiumMessage, {
      fontSize: "11px",
      color: "var(--text-muted)",
      marginTop: "8px",
      fontStyle: "italic",
    });
  }

  // Contenedor de opciones (oculto por defecto)
  const optionsContainer = createDiv(container, { cls: "notelert-recurrence-options" });
  setCssProps(optionsContainer, {
    display: "none",
    marginTop: "15px",
    paddingTop: "15px",
    borderTop: "1px solid var(--background-modifier-border)",
  });

  // Fila: Cada X [unidad]
  const intervalRow = createDiv(optionsContainer);
  setCssProps(intervalRow, {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "12px",
    flexWrap: "wrap",
  });

  createSpan(intervalRow, { text: getTranslation(language, "recurrence.every") || "Cada" });

  const intervalInput = createEl(intervalRow, "input", { type: "number" });
  intervalInput.value = "1";
  intervalInput.min = "1";
  intervalInput.max = "365";
  setCssProps(intervalInput, {
    width: "60px",
    padding: "6px 8px",
    borderRadius: "4px",
    border: "1px solid var(--background-modifier-border)",
    background: "var(--background-primary)",
    textAlign: "center",
  });

  const unitSelect = createEl(intervalRow, "select");
  setCssProps(unitSelect, {
    padding: "6px 10px",
    borderRadius: "4px",
    border: "1px solid var(--background-modifier-border)",
    background: "var(--background-primary)",
    minWidth: "100px",
  });

  const units: { value: RecurrenceUnit; labelKey: string }[] = [
    { value: 'day', labelKey: 'recurrence.day' },
    { value: 'week', labelKey: 'recurrence.week' },
    { value: 'month', labelKey: 'recurrence.month' },
    { value: 'year', labelKey: 'recurrence.year' },
  ];

  units.forEach(unit => {
    const option = createEl(unitSelect, "option", {
      value: unit.value,
      text: getTranslation(language, unit.labelKey),
    });
    if (unit.value === 'day') option.selected = true;
  });

  // Fila: Termina
  const endLabel = createDiv(optionsContainer, {
    text: getTranslation(language, "recurrence.ends"),
  });
  setCssProps(endLabel, {
    marginBottom: "8px",
    fontWeight: "500",
    fontSize: "13px",
  });

  const endOptionsContainer = createDiv(optionsContainer);
  setCssProps(endOptionsContainer, {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  });

  // Opción: Nunca
  const neverRow = createEl(endOptionsContainer, "label");
  setCssProps(neverRow, {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
    fontSize: "13px",
  });
  const neverRadio = createEl(neverRow, "input", { type: "radio" });
  neverRadio.name = "recurrence-end";
  neverRadio.value = "never";
  neverRadio.checked = true;
  createSpan(neverRow, { text: getTranslation(language, "recurrence.never") });

  // Opción: Después de X veces
  const countRow = createEl(endOptionsContainer, "label");
  setCssProps(countRow, {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
    fontSize: "13px",
    flexWrap: "wrap",
  });
  const countRadio = createEl(countRow, "input", { type: "radio" });
  countRadio.name = "recurrence-end";
  countRadio.value = "count";
  createSpan(countRow, { text: getTranslation(language, "recurrence.after") });
  
  const countInput = createEl(countRow, "input", { type: "number" });
  countInput.value = "10";
  countInput.min = "1";
  countInput.max = "999";
  setCssProps(countInput, {
    width: "50px",
    padding: "4px 6px",
    borderRadius: "4px",
    border: "1px solid var(--background-modifier-border)",
    background: "var(--background-primary)",
    textAlign: "center",
  });
  createSpan(countRow, { text: getTranslation(language, "recurrence.times") || "veces" });

  // Opción: En fecha
  const dateRow = createEl(endOptionsContainer, "label");
  setCssProps(dateRow, {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
    fontSize: "13px",
    flexWrap: "wrap",
  });
  const dateRadio = createEl(dateRow, "input", { type: "radio" });
  dateRadio.name = "recurrence-end";
  dateRadio.value = "date";
  createSpan(dateRow, { text: getTranslation(language, "recurrence.onDate") || "En fecha" });
  
  const endDateInput = createEl(dateRow, "input", { type: "date" });
  // Default: 1 mes desde hoy
  const defaultEndDate = new Date();
  defaultEndDate.setMonth(defaultEndDate.getMonth() + 1);
  endDateInput.value = defaultEndDate.toISOString().split('T')[0];
  setCssProps(endDateInput, {
    padding: "4px 8px",
    borderRadius: "4px",
    border: "1px solid var(--background-modifier-border)",
    background: "var(--background-primary)",
  });

  // Event listeners
  toggleCheckbox.addEventListener("change", () => {
    // Si no es premium, el checkbox está deshabilitado, pero por si acaso
    if (!premiumAccess) {
      toggleCheckbox.checked = false;
      onPremiumRequired();
      return;
    }
    
    config.enabled = toggleCheckbox.checked;
    setCssProps(optionsContainer, {
      display: toggleCheckbox.checked ? "block" : "none",
    });
    onToggle(toggleCheckbox.checked);
  });

  // También permitir click en el label (solo si es premium)
  toggleLabel.addEventListener("click", (event) => {
    if (!premiumAccess) {
      event.preventDefault();
      event.stopPropagation();
      onPremiumRequired();
      return;
    }
    toggleCheckbox.checked = !toggleCheckbox.checked;
    toggleCheckbox.dispatchEvent(new Event("change"));
  });

  toggleContainer.addEventListener("click", (event) => {
    if (premiumAccess) return;
    event.preventDefault();
    onPremiumRequired();
  });

  intervalInput.addEventListener("change", () => {
    config.interval = parseInt(intervalInput.value) || 1;
  });

  unitSelect.addEventListener("change", () => {
    config.unit = unitSelect.value as RecurrenceUnit;
  });

  neverRadio.addEventListener("change", () => {
    if (neverRadio.checked) config.endType = 'never';
  });

  countRadio.addEventListener("change", () => {
    if (countRadio.checked) config.endType = 'count';
  });

  countInput.addEventListener("change", () => {
    config.endCount = parseInt(countInput.value) || 10;
  });

  dateRadio.addEventListener("change", () => {
    if (dateRadio.checked) config.endType = 'date';
  });

  endDateInput.addEventListener("change", () => {
    config.endDate = endDateInput.value;
  });

  // Función para actualizar el estado premium dinámicamente
  const updatePremiumUI = (newIsPremium: boolean) => {
    premiumAccess = newIsPremium;
    // Actualizar checkbox
    toggleCheckbox.disabled = !newIsPremium;
    setCssProps(toggleCheckbox, {
      cursor: newIsPremium ? "pointer" : "not-allowed",
    });
    
    // Actualizar contenedor del toggle
    setCssProps(toggleContainer, {
      cursor: newIsPremium ? "pointer" : "not-allowed",
      opacity: newIsPremium ? "1" : "0.7",
    });
    
    // Actualizar label
    setCssProps(toggleLabel, {
      cursor: newIsPremium ? "pointer" : "not-allowed",
    });
    
    // Mostrar/ocultar mensaje de premium
    if (newIsPremium && premiumMessage) {
      premiumMessage.remove();
      premiumMessage = null;
    } else if (!newIsPremium && !premiumMessage) {
      premiumMessage = createDiv(container, {
        text: getTranslation(language, "recurrence.premiumHint") || "⭐ Actualiza a Premium para usar notificaciones recurrentes",
      });
      setCssProps(premiumMessage, {
        fontSize: "11px",
        color: "var(--text-muted)",
        marginTop: "8px",
        fontStyle: "italic",
      });
      // Insertar después del toggleContainer
      container.insertBefore(premiumMessage, optionsContainer);
    }
  };

  return {
    container,
    getConfig: () => ({
      ...config,
      interval: parseInt(intervalInput.value) || 1,
      unit: unitSelect.value as RecurrenceUnit,
      endCount: parseInt(countInput.value) || 10,
      endDate: endDateInput.value,
    }),
    setEnabled: (enabled: boolean) => {
      toggleCheckbox.checked = enabled;
      config.enabled = enabled;
      setCssProps(optionsContainer, {
        display: enabled ? "block" : "none",
      });
    },
    isEnabled: () => config.enabled,
    updatePremiumStatus: updatePremiumUI,
  };
}
