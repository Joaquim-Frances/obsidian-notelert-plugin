/**
 * Componente para seleccionar hora visualmente
 */

import type {} from "obsidian";
import { getTranslation } from "../../../i18n";
import { setCssProps, createDiv, createEl, setElementId, setElementText, getElementInt, addElementListener } from "../../../core/dom";
import { getInitialTime } from "../utils/date-utils";

export interface TimePickerResult {
  timeInput: HTMLInputElement;
  hoursDisplay: HTMLElement;
  minutesDisplay: HTMLElement;
  container: HTMLElement;
  updateTime: (hours: number, minutes: number) => void;
}

/**
 * Actualiza el display visual de hora y sincroniza con input oculto
 */
function updateTimeDisplay(
  hours: number,
  minutes: number,
  hoursDisplay: HTMLElement,
  minutesDisplay: HTMLElement,
  timeInput: HTMLInputElement
): void {
  // Asegurar valores válidos
  if (hours < 0) hours = 0;
  if (hours > 23) hours = 23;
  if (minutes < 0) minutes = 0;
  if (minutes > 59) minutes = 59;

  // Actualizar displays
  setElementText(hoursDisplay, String(hours).padStart(2, '0'));
  setElementText(minutesDisplay, String(minutes).padStart(2, '0'));

  // Sincronizar con input oculto (formato HH:MM)
  const timeString = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  timeInput.value = timeString;
}

/**
 * Crea el componente de selector de hora
 */
export function createTimePicker(
  parent: HTMLElement,
  language: string,
  isDesktop: boolean
): TimePickerResult {
  const timeContainer = createDiv(parent, { cls: "notelert-time-container" });
  setCssProps(timeContainer, { 
    marginBottom: "20px",
    display: "block",
    visibility: "visible",
    opacity: "1"
  });

  const timeLabel = createEl(timeContainer, "label", { 
    text: getTranslation(language, "datePicker.timeLabel") 
  });
  setCssProps(timeLabel, {
    display: "block",
    marginBottom: "10px",
    fontWeight: "500",
  });

  // Contenedor para el selector visual de hora
  const timePickerContainer = createDiv(timeContainer);
  setCssProps(timePickerContainer, {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: isDesktop ? "20px" : "15px",
    padding: isDesktop ? "20px" : "15px",
    background: "var(--background-secondary)",
    borderRadius: "8px",
    border: "1px solid var(--background-modifier-border)",
  });

  // Selector de horas
  const hoursContainer = createDiv(timePickerContainer);
  setCssProps(hoursContainer, {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    flex: "0 0 auto",
  });

  const hoursLabel = createDiv(hoursContainer, {
    text: getTranslation(language, "datePicker.hours"),
  });
  setCssProps(hoursLabel, {
    fontSize: "11px",
    color: "var(--text-muted)",
    textTransform: "uppercase",
    fontWeight: "500",
    letterSpacing: "0.5px",
  });

  const hoursDisplay = createDiv(hoursContainer, {
    text: "12",
  });
  const displayWidth = isDesktop ? "80px" : "70px";
  setCssProps(hoursDisplay, {
    fontSize: isDesktop ? "32px" : "28px",
    fontWeight: "600",
    color: "var(--text-normal)",
    width: displayWidth,
    textAlign: "center",
    padding: isDesktop ? "10px 0" : "8px 0",
    background: "var(--background-primary)",
    borderRadius: "6px",
    border: "2px solid var(--interactive-accent)",
    boxSizing: "border-box",
    margin: "0 auto",
  });
  setElementId(hoursDisplay, "hours-display");

  const hoursButtons = createDiv(hoursContainer);
  setCssProps(hoursButtons, {
    display: "flex",
    gap: "8px",
    alignItems: "center",
    justifyContent: "center",
    width: displayWidth,
    boxSizing: "border-box",
  });

  // Calcular ancho de botones para que quepan perfectamente centrados
  // Para desktop: 80px - 8px gap = 72px / 2 = 36px por botón
  // Para mobile: 70px - 8px gap = 62px / 2 = 31px por botón
  const buttonWidth = isDesktop ? "36px" : "31px";
  const buttonHeight = isDesktop ? "36px" : "32px";
  const createTimeButton = (text: string, isDesktop: boolean, container: HTMLElement): HTMLButtonElement => {
    const btn = createEl(container, "button", { text });
    setCssProps(btn, {
      width: buttonWidth,
      height: buttonHeight,
      minWidth: buttonWidth,
      maxWidth: buttonWidth,
      borderRadius: "6px",
      border: "1px solid var(--background-modifier-border)",
      background: "var(--background-primary)",
      fontSize: isDesktop ? "20px" : "18px",
      fontWeight: "600",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "all 0.2s",
      flex: "0 0 auto",
      padding: "0",
      margin: "0",
    });
    addElementListener(btn, "mouseenter", () => {
      setCssProps(btn, {
        background: "var(--background-modifier-hover)",
        borderColor: "var(--interactive-accent)",
      });
    });
    addElementListener(btn, "mouseleave", () => {
      setCssProps(btn, {
        background: "var(--background-primary)",
        borderColor: "var(--background-modifier-border)",
      });
    });
    return btn;
  };

  const hoursDecreaseBtn = createTimeButton("−", isDesktop, hoursButtons);
  const hoursIncreaseBtn = createTimeButton("+", isDesktop, hoursButtons);

  // Separador
  const colonEl = createDiv(timePickerContainer, {
    text: ":",
  });
  setCssProps(colonEl, {
    fontSize: isDesktop ? "32px" : "28px",
    fontWeight: "600",
    color: "var(--text-normal)",
    margin: `0 ${isDesktop ? "10px" : "5px"}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    flex: "0 0 auto",
  });

  // Selector de minutos
  const minutesContainer = createDiv(timePickerContainer);
  setCssProps(minutesContainer, {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    flex: "0 0 auto",
  });

  const minutesLabel = createDiv(minutesContainer, {
    text: getTranslation(language, "datePicker.minutes"),
  });
  setCssProps(minutesLabel, {
    fontSize: "11px",
    color: "var(--text-muted)",
    textTransform: "uppercase",
    fontWeight: "500",
    letterSpacing: "0.5px",
  });

  const minutesDisplay = createDiv(minutesContainer, {
    text: "00",
  });
  const minutesDisplayWidth = isDesktop ? "80px" : "70px";
  setCssProps(minutesDisplay, {
    fontSize: isDesktop ? "32px" : "28px",
    fontWeight: "600",
    color: "var(--text-normal)",
    width: minutesDisplayWidth,
    textAlign: "center",
    padding: isDesktop ? "10px 0" : "8px 0",
    background: "var(--background-primary)",
    borderRadius: "6px",
    border: "2px solid var(--interactive-accent)",
    boxSizing: "border-box",
    margin: "0 auto",
  });
  setElementId(minutesDisplay, "minutes-display");

  const minutesButtons = createDiv(minutesContainer);
  setCssProps(minutesButtons, {
    display: "flex",
    gap: "8px",
    alignItems: "center",
    justifyContent: "center",
    width: minutesDisplayWidth,
    boxSizing: "border-box",
  });

  const minutesDecreaseBtn = createTimeButton("−", isDesktop, minutesButtons);
  const minutesIncreaseBtn = createTimeButton("+", isDesktop, minutesButtons);

  // Input oculto para mantener compatibilidad
  const timeInput: HTMLInputElement = createEl(timeContainer, "input", {
    type: "time",
    cls: "notelert-time-input"
  });
  setCssProps(timeInput, { display: "none" });
  setElementId(timeInput, "hidden-time-input");

  // Funciones para actualizar hora/minutos
  const updateHours = (delta: number) => {
    const currentHours = getElementInt(hoursDisplay, 12);
    const currentMinutes = getElementInt(minutesDisplay, 0);
    let newHours = currentHours + delta;
    if (newHours < 0) newHours = 23;
    if (newHours > 23) newHours = 0;
    updateTimeDisplay(newHours, currentMinutes, hoursDisplay, minutesDisplay, timeInput);
  };

  const updateMinutes = (delta: number) => {
    const currentHours = getElementInt(hoursDisplay, 12);
    const currentMinutes = getElementInt(minutesDisplay, 0);
    let newMinutes = currentMinutes + delta;
    let newHours = currentHours;

    if (newMinutes < 0) {
      newMinutes = 59;
      newHours = newHours - 1;
      if (newHours < 0) newHours = 23;
    } else if (newMinutes > 59) {
      newMinutes = 0;
      newHours = newHours + 1;
      if (newHours > 23) newHours = 0;
    }

    updateTimeDisplay(newHours, newMinutes, hoursDisplay, minutesDisplay, timeInput);
  };

  addElementListener(hoursDecreaseBtn, "click", () => updateHours(-1));
  addElementListener(hoursIncreaseBtn, "click", () => updateHours(1));
  addElementListener(minutesDecreaseBtn, "click", () => updateMinutes(-5));
  addElementListener(minutesIncreaseBtn, "click", () => updateMinutes(5));

  // Botones rápidos de hora (solo en desktop)
  if (isDesktop) {
    const quickTimeButtons = createDiv(timeContainer);
    setCssProps(quickTimeButtons, {
      display: "flex",
      gap: "8px",
      flexWrap: "wrap",
      marginTop: "15px",
      justifyContent: "center",
    });

    const quickTimes = [
      { label: "9:00", hours: 9, minutes: 0 },
      { label: "12:00", hours: 12, minutes: 0 },
      { label: "15:00", hours: 15, minutes: 0 },
      { label: "18:00", hours: 18, minutes: 0 },
      { label: "21:00", hours: 21, minutes: 0 },
    ];

    quickTimes.forEach(qt => {
      const btn = createEl(quickTimeButtons, "button", {
        text: qt.label,
      });
      setCssProps(btn, {
        padding: "6px 12px",
        fontSize: "12px",
        borderRadius: "3px",
        border: "1px solid var(--background-modifier-border)",
        background: "var(--background-primary)",
        cursor: "pointer",
        transition: "all 0.2s",
      });
      addElementListener(btn, "click", () => {
        updateTimeDisplay(qt.hours, qt.minutes, hoursDisplay, minutesDisplay, timeInput);
      });
      addElementListener(btn, "mouseenter", () => {
        setCssProps(btn, {
          background: "var(--background-modifier-hover)",
          borderColor: "var(--interactive-accent)",
        });
      });
      addElementListener(btn, "mouseleave", () => {
        setCssProps(btn, {
          background: "var(--background-primary)",
          borderColor: "var(--background-modifier-border)",
        });
      });
    });
  }

  // Inicializar con hora actual + 1 hora
  const { hours, minutes } = getInitialTime();
  updateTimeDisplay(hours, minutes, hoursDisplay, minutesDisplay, timeInput);

  return {
    timeInput,
    hoursDisplay,
    minutesDisplay,
    container: timeContainer,
    updateTime: (h: number, m: number) => updateTimeDisplay(h, m, hoursDisplay, minutesDisplay, timeInput)
  };
}
