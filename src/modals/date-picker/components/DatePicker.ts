/**
 * Componente para seleccionar fecha
 */

import type {} from "obsidian";
import { getTranslation } from "../../../i18n";
import { setCssProps, createDiv, createEl } from "../../../core/dom";

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
  const dateContainer = createDiv(parent, { cls: "notelert-date-container" });
  setCssProps(dateContainer, { 
    marginBottom: "15px",
    display: "block",
    visibility: "visible",
    opacity: "1"
  });

  const dateLabel = createEl(dateContainer, "label", { 
    text: getTranslation(language, "datePicker.dateLabel") 
  });
  setCssProps(dateLabel, {
    display: "block",
    marginBottom: "5px",
    fontWeight: "500",
  });

  const dateInput: HTMLInputElement = createEl(dateContainer, "input", {
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
