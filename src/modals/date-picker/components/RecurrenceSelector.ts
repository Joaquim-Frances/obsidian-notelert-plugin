/**
 * Componente para seleccionar recurrencia de notificaciones
 */

import { getTranslation } from "../../../i18n";
import { setCssProps } from "../../../core/dom";

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
  _onPremiumRequired: () => void, // Ya no se usa, mantenemos por compatibilidad
  isPremium: boolean
): RecurrenceSelectorResult {
  let config: RecurrenceConfig = {
    enabled: false,
    interval: 1,
    unit: 'day',
    endType: 'never',
    endCount: 10,
    endDate: undefined,
  };

  // Contenedor principal
  const container = parent.createEl("div", { cls: "notelert-recurrence-container" });
  setCssProps(container, {
    marginTop: "15px",
    padding: "15px",
    background: "var(--background-secondary)",
    borderRadius: "8px",
    width: "100%",
    boxSizing: "border-box",
  });

  // Toggle de recurrencia
  const toggleContainer = container.createEl("div", { cls: "notelert-recurrence-toggle" });
  setCssProps(toggleContainer, {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    cursor: isPremium ? "pointer" : "not-allowed",
    opacity: isPremium ? "1" : "0.7",
  });

  const toggleLabel = toggleContainer.createEl("label", {
    text: getTranslation(language, "recurrence.repeatLabel") || "Repetir",
  });
  setCssProps(toggleLabel, {
    fontWeight: "500",
    fontSize: "14px",
    cursor: isPremium ? "pointer" : "not-allowed",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  });

  const toggleCheckbox = toggleContainer.createEl("input", { type: "checkbox" }) as HTMLInputElement;
  toggleCheckbox.id = "recurrence-toggle";
  toggleCheckbox.disabled = !isPremium;
  setCssProps(toggleCheckbox, {
    width: "18px",
    height: "18px",
    cursor: isPremium ? "pointer" : "not-allowed",
  });

  // Mensaje de premium requerido (solo si no es premium)
  let premiumMessage: HTMLElement | null = null;
  if (!isPremium) {
    premiumMessage = container.createEl("div", {
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
  const optionsContainer = container.createEl("div", { cls: "notelert-recurrence-options" });
  setCssProps(optionsContainer, {
    display: "none",
    marginTop: "15px",
    paddingTop: "15px",
    borderTop: "1px solid var(--background-modifier-border)",
  });

  // Fila: Cada X [unidad]
  const intervalRow = optionsContainer.createEl("div");
  setCssProps(intervalRow, {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "12px",
    flexWrap: "wrap",
  });

  intervalRow.createEl("span", { text: getTranslation(language, "recurrence.every") || "Cada" });

  const intervalInput = intervalRow.createEl("input", { type: "number" }) as HTMLInputElement;
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

  const unitSelect = intervalRow.createEl("select") as HTMLSelectElement;
  setCssProps(unitSelect, {
    padding: "6px 10px",
    borderRadius: "4px",
    border: "1px solid var(--background-modifier-border)",
    background: "var(--background-primary)",
    minWidth: "100px",
  });

  const units: { value: RecurrenceUnit; labelKey: string; defaultLabel: string }[] = [
    { value: 'day', labelKey: 'recurrence.day', defaultLabel: 'Día(s)' },
    { value: 'week', labelKey: 'recurrence.week', defaultLabel: 'Semana(s)' },
    { value: 'month', labelKey: 'recurrence.month', defaultLabel: 'Mes(es)' },
    { value: 'year', labelKey: 'recurrence.year', defaultLabel: 'Año(s)' },
  ];

  units.forEach(unit => {
    const option = unitSelect.createEl("option", {
      value: unit.value,
      text: getTranslation(language, unit.labelKey) || unit.defaultLabel,
    });
    if (unit.value === 'day') option.selected = true;
  });

  // Fila: Termina
  const endLabel = optionsContainer.createEl("div", {
    text: getTranslation(language, "recurrence.ends") || "Termina:",
  });
  setCssProps(endLabel, {
    marginBottom: "8px",
    fontWeight: "500",
    fontSize: "13px",
  });

  const endOptionsContainer = optionsContainer.createEl("div");
  setCssProps(endOptionsContainer, {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  });

  // Opción: Nunca
  const neverRow = endOptionsContainer.createEl("label");
  setCssProps(neverRow, {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
    fontSize: "13px",
  });
  const neverRadio = neverRow.createEl("input", { type: "radio" }) as HTMLInputElement;
  neverRadio.name = "recurrence-end";
  neverRadio.value = "never";
  neverRadio.checked = true;
  neverRow.createEl("span", { text: getTranslation(language, "recurrence.never") || "Nunca" });

  // Opción: Después de X veces
  const countRow = endOptionsContainer.createEl("label");
  setCssProps(countRow, {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
    fontSize: "13px",
    flexWrap: "wrap",
  });
  const countRadio = countRow.createEl("input", { type: "radio" }) as HTMLInputElement;
  countRadio.name = "recurrence-end";
  countRadio.value = "count";
  countRow.createEl("span", { text: getTranslation(language, "recurrence.after") || "Después de" });
  
  const countInput = countRow.createEl("input", { type: "number" }) as HTMLInputElement;
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
  countRow.createEl("span", { text: getTranslation(language, "recurrence.times") || "veces" });

  // Opción: En fecha
  const dateRow = endOptionsContainer.createEl("label");
  setCssProps(dateRow, {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
    fontSize: "13px",
    flexWrap: "wrap",
  });
  const dateRadio = dateRow.createEl("input", { type: "radio" }) as HTMLInputElement;
  dateRadio.name = "recurrence-end";
  dateRadio.value = "date";
  dateRow.createEl("span", { text: getTranslation(language, "recurrence.onDate") || "En fecha" });
  
  const endDateInput = dateRow.createEl("input", { type: "date" }) as HTMLInputElement;
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
    if (!isPremium) {
      toggleCheckbox.checked = false;
      return;
    }
    
    config.enabled = toggleCheckbox.checked;
    setCssProps(optionsContainer, {
      display: toggleCheckbox.checked ? "block" : "none",
    });
    onToggle(toggleCheckbox.checked);
  });

  // También permitir click en el label (solo si es premium)
  toggleLabel.addEventListener("click", () => {
    if (!isPremium) {
      // No hacer nada, el mensaje ya está visible
      return;
    }
    toggleCheckbox.checked = !toggleCheckbox.checked;
    toggleCheckbox.dispatchEvent(new Event("change"));
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
      premiumMessage = container.createEl("div", {
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
