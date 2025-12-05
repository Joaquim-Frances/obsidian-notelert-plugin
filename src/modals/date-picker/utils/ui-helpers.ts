/**
 * Utilidades para manejo de UI (estados de carga, etc.)
 */

import { HTMLButtonElement } from "obsidian";
import { getTranslation } from "../../../i18n";

// WeakMap para almacenar el texto original de los botones
const buttonOriginalText = new WeakMap<HTMLButtonElement, string>();

/**
 * Muestra el estado de carga en un botón
 */
export function showLoadingState(button: HTMLButtonElement, language: string): void {
  // Guardar el texto original
  if (button.textContent) {
    buttonOriginalText.set(button, button.textContent);
  }

  // Deshabilitar botón
  button.disabled = true;
  const { setCssProps } = require("../../../core/dom");
  setCssProps(button, {
    opacity: '0.6',
    cursor: 'not-allowed',
  });

  // Texto de carga
  button.textContent = getTranslation(language, "datePicker.confirmButton") || "Confirmando...";
}

/**
 * Oculta el estado de carga y restaura el botón
 */
export function hideLoadingState(button: HTMLButtonElement, language: string): void {
  // Restaurar texto original
  const originalText =
    buttonOriginalText.get(button) ||
    getTranslation(language, "datePicker.confirmButton") ||
    "Confirmar";
  button.textContent = originalText;

  // Restaurar estado del botón
  button.disabled = false;
  const { setCssProps } = require("../../../core/dom");
  setCssProps(button, {
    opacity: '1',
    cursor: 'pointer',
  });
}

