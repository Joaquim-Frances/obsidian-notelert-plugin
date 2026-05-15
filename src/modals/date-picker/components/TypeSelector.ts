/**
 * Componente para seleccionar tipo de notificación (time/location)
 */

import type {} from "obsidian";
import { getTranslation } from "../../../i18n";
import { setCssProps, createDiv, createEl, setElementId, setElementClassName, findHTMLElement, addElementListener } from "../../../core/dom";
import { NotificationType } from "../types";

export interface TypeSelectorResult {
  container: HTMLElement;
  timeButton: HTMLButtonElement;
  locationButton: HTMLButtonElement;
  setType: (type: NotificationType) => void;
}

/**
 * Crea el componente selector de tipo
 */
export function createTypeSelector(
  parent: HTMLElement,
  language: string,
  isDesktop: boolean,
  currentType: NotificationType,
  onTypeChange: (type: NotificationType) => void
): TypeSelectorResult {
  const typeContainer = createDiv(parent, { cls: "notelert-type-container" });
  setCssProps(typeContainer, {
    marginBottom: "20px",
    padding: isDesktop ? "10px 15px" : "15px",
    background: "var(--background-secondary)",
    borderRadius: "6px",
    width: "100%",
    boxSizing: "border-box",
  });

  createEl(typeContainer, "label", {
    text: getTranslation(language, "datePicker.notificationType"),
  });
  const label = findHTMLElement(typeContainer, "label");
  if (label) {
    setCssProps(label, {
      display: "block",
      marginBottom: "8px",
      fontWeight: "500",
      fontSize: "14px",
    });
  }

  const typeButtonsContainer = createDiv(typeContainer);
  setCssProps(typeButtonsContainer, {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    width: "100%",
  });

  const timeButton = createEl(typeButtonsContainer, "button", {
    text: getTranslation(language, "datePicker.timeNotification"),
    cls: "mod-cta"
  });
  setCssProps(timeButton, {
    flex: "1",
    minWidth: "120px",
    padding: "10px",
    fontSize: "14px",
    whiteSpace: "nowrap",
  });
  setElementId(timeButton, "notification-type-time");

  const locationButton = createEl(typeButtonsContainer, "button", {
    text: getTranslation(language, "datePicker.locationNotification"),
    cls: "mod-secondary"
  });
  setCssProps(locationButton, {
    flex: "1",
    minWidth: "120px",
    padding: "10px",
    fontSize: "14px",
    whiteSpace: "nowrap",
  });
  setElementId(locationButton, "notification-type-location");

  // Actualizar estilos según el tipo seleccionado
  const updateTypeButtons = (type: NotificationType) => {
    if (type === 'time') {
      setElementClassName(timeButton, "mod-cta");
      setElementClassName(locationButton, "mod-secondary");
    } else {
      setElementClassName(timeButton, "mod-secondary");
      setElementClassName(locationButton, "mod-cta");
    }
  };

  addElementListener(timeButton, "click", () => {
    updateTypeButtons('time');
    onTypeChange('time');
  });

  addElementListener(locationButton, "click", () => {
    updateTypeButtons('location');
    onTypeChange('location');
  });

  updateTypeButtons(currentType);

  return {
    container: typeContainer,
    timeButton,
    locationButton,
    setType: (type: NotificationType) => {
      updateTypeButtons(type);
      onTypeChange(type);
    }
  };
}
