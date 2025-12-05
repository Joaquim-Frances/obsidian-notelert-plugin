/**
 * Componente para acciones rápidas de fecha/hora
 */

import { HTMLElement } from "obsidian";
import { getTranslation } from "../../../../i18n";
import { setCssProps } from "../../../../core/dom";
import { getToday, getTomorrow, getTimeInHours } from "../utils/date-utils";

export interface QuickActionsResult {
  container: HTMLElement;
}

/**
 * Crea el componente de acciones rápidas
 */
export function createQuickActions(
  parent: HTMLElement,
  language: string,
  onAction: (date: string, time: string) => void
): QuickActionsResult {
  const quickActions = parent.createEl("div", { cls: "notelert-quick-actions" });
  setCssProps(quickActions, {
    marginBottom: "20px",
    width: "100%",
    boxSizing: "border-box",
  });
  quickActions.id = "quick-actions-container";

  const quickActionsTitle = quickActions.createEl("p", { 
    text: getTranslation(language, "datePicker.quickActions") 
  });
  setCssProps(quickActionsTitle, {
    marginBottom: "10px",
    fontWeight: "500",
  });

  const quickButtonsContainer = quickActions.createEl("div");
  setCssProps(quickButtonsContainer, {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    width: "100%",
  });

  // Botones de acciones rápidas
  const quickActionsData = [
    { label: getTranslation(language, "datePicker.today"), date: getToday(), time: "09:00" },
    { label: getTranslation(language, "datePicker.tomorrow"), date: getTomorrow(), time: "09:00" },
    { label: getTranslation(language, "datePicker.in1Hour"), date: getToday(), time: getTimeInHours(1) },
    { label: getTranslation(language, "datePicker.in2Hours"), date: getToday(), time: getTimeInHours(2) },
  ];

  quickActionsData.forEach(action => {
    const button = quickButtonsContainer.createEl("button", {
      text: action.label,
      cls: "mod-secondary"
    });
    setCssProps(button, {
      padding: "4px 8px",
      fontSize: "12px",
    });
    button.addEventListener("click", () => {
      onAction(action.date, action.time);
    });
  });

  return {
    container: quickActions
  };
}

