/**
 * Componente para seleccionar tipo de notificación (time/location)
 */

import { HTMLElement } from "obsidian";
import { getTranslation } from "../../../i18n";
import { setCssProps, isHTMLElement } from "../../../core/dom";
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
  const typeContainer = parent.createEl("div", { cls: "notelert-type-container" });
  setCssProps(typeContainer, {
    marginBottom: "20px",
    padding: "15px",
    background: "var(--background-secondary)",
    borderRadius: "6px",
    width: "100%",
    boxSizing: "border-box",
    display: isDesktop ? "none" : "",
  });

  typeContainer.createEl("label", {
    text: getTranslation(language, "datePicker.notificationType"),
  });
  const label = typeContainer.querySelector("label");
  if (label && isHTMLElement(label)) {
    setCssProps(label, {
      display: "block",
      marginBottom: "8px",
      fontWeight: "500",
      fontSize: "14px",
    });
  }

  const typeButtonsContainer = typeContainer.createEl("div");
  setCssProps(typeButtonsContainer, {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    width: "100%",
  });

  const timeButton = typeButtonsContainer.createEl("button", {
    text: getTranslation(language, "datePicker.timeNotification"),
    cls: "mod-cta"
  }) as HTMLButtonElement;
  setCssProps(timeButton, {
    flex: "1",
    minWidth: "120px",
    padding: "10px",
    fontSize: "14px",
    whiteSpace: "nowrap",
  });
  timeButton.id = "notification-type-time";

  const locationButton = typeButtonsContainer.createEl("button", {
    text: getTranslation(language, "datePicker.locationNotification"),
    cls: "mod-secondary"
  }) as HTMLButtonElement;
  setCssProps(locationButton, {
    flex: "1",
    minWidth: "120px",
    padding: "10px",
    fontSize: "14px",
    whiteSpace: "nowrap",
  });
  locationButton.id = "notification-type-location";

  // Actualizar estilos según el tipo seleccionado
  const updateTypeButtons = (type: NotificationType) => {
    if (type === 'time') {
      timeButton.className = "mod-cta";
      locationButton.className = "mod-secondary";
    } else {
      timeButton.className = "mod-secondary";
      locationButton.className = "mod-cta";
    }
  };

  timeButton.addEventListener("click", () => {
    updateTypeButtons('time');
    onTypeChange('time');
  });

  locationButton.addEventListener("click", () => {
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

