/**
 * Componente para seleccionar fecha
 */

import { HTMLElement } from "obsidian";
import { getTranslation } from "../../../../i18n";
import { setCssProps } from "../../../../core/dom";

export interface DatePickerResult {
  dateInput: HTMLInputElement;
  container: HTMLElement;
}

/**
 * Crea el componente de selector de fecha
 */
export function createDatePicker(
  parent: HTMLElement,
  language: string,
  initialDate: string
): DatePickerResult {
  const dateContainer = parent.createEl("div", { cls: "notelert-date-container" });
  setCssProps(dateContainer, { marginBottom: "15px" });

  const dateLabel = dateContainer.createEl("label", { 
    text: getTranslation(language, "datePicker.dateLabel") 
  });
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
  dateInput.value = initialDate;

  return {
    dateInput,
    container: dateContainer
  };
}

