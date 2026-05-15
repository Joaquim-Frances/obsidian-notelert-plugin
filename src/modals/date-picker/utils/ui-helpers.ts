/**
 * Utilidades para manejo de UI (estados de carga, etc.)
 */

import { getTranslation } from "../../../i18n";
import { setCssProps, getElementText, setElementText, setButtonDisabled } from "../../../core/dom";

// WeakMap para almacenar el texto original de los botones
const buttonOriginalText = new WeakMap<HTMLButtonElement, string>();

/**
 * Muestra el estado de carga en un botón
 */
export function showLoadingState(button: HTMLButtonElement, language: string): void {
  // Guardar el texto original
  const originalText = getElementText(button);
  if (originalText) {
    buttonOriginalText.set(button, originalText);
  }

  // Deshabilitar botón
  setButtonDisabled(button, true);
  setCssProps(button, {
    opacity: '0.6',
    cursor: 'not-allowed',
  });

  // Texto de carga
  setElementText(button, getTranslation(language, "datePicker.confirmButton") || "Confirmando...");
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
  setElementText(button, originalText);

  // Restaurar estado del botón
  setButtonDisabled(button, false);
  setCssProps(button, {
    opacity: '1',
    cursor: 'pointer',
  });
}
