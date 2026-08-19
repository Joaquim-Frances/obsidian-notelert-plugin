/**
 * Componente para seleccionar fecha
 */

import type {} from "obsidian";
import { getTranslation } from "../../../i18n";
import { setCssProps, createDiv, createEl } from "../../../core/dom";
import { getToday } from "../utils/date-utils";

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
    // Native date controls reserve space for a platform icon. Keep the text
    // clear of it on both left- and right-indicator desktop implementations.
    padding: "10px 3rem 10px 2.4rem",
    border: "1px solid var(--background-modifier-border)",
    borderRadius: "6px",
    boxSizing: "border-box",
    fontSize: "14px",
  });
  dateInput.value = initialDate;
  dateInput.min = getToday();

  return {
    dateInput,
    container: dateContainer
  };
}
