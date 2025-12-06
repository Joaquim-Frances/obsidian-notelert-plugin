/**
 * Componente para seleccionar hora visualmente
 */

import { HTMLElement, HTMLInputElement } from "obsidian";
import { getTranslation } from "../../../i18n";
import { setCssProps } from "../../../core/dom";
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
  hoursDisplay.textContent = String(hours).padStart(2, '0');
  minutesDisplay.textContent = String(minutes).padStart(2, '0');

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
  const timeContainer = parent.createEl("div", { cls: "notelert-time-container" });
  setCssProps(timeContainer, { 
    marginBottom: "20px",
    display: "block",
    visibility: "visible",
    opacity: "1"
  });

  const timeLabel = timeContainer.createEl("label", { 
    text: getTranslation(language, "datePicker.timeLabel") 
  });
  setCssProps(timeLabel, {
    display: "block",
    marginBottom: "10px",
    fontWeight: "500",
  });

  // Contenedor para el selector visual de hora
  const timePickerContainer = timeContainer.createEl("div");
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
  const hoursContainer = timePickerContainer.createEl("div");
  setCssProps(hoursContainer, {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
  });

  const hoursLabel = hoursContainer.createEl("div", {
    text: getTranslation(language, "datePicker.hours"),
  });
  setCssProps(hoursLabel, {
    fontSize: "11px",
    color: "var(--text-muted)",
    textTransform: "uppercase",
    fontWeight: "500",
    letterSpacing: "0.5px",
  });

  const hoursDisplay = hoursContainer.createEl("div", {
    text: "12",
  });
  setCssProps(hoursDisplay, {
    fontSize: isDesktop ? "32px" : "28px",
    fontWeight: "600",
    color: "var(--text-normal)",
    minWidth: isDesktop ? "60px" : "50px",
    textAlign: "center",
    padding: isDesktop ? "10px 15px" : "8px 12px",
    background: "var(--background-primary)",
    borderRadius: "6px",
    border: "2px solid var(--interactive-accent)",
  });
  hoursDisplay.id = "hours-display";

  const hoursButtons = hoursContainer.createEl("div");
  setCssProps(hoursButtons, {
    display: "flex",
    gap: "8px",
    alignItems: "center",
    justifyContent: "center",
  });

  const createTimeButton = (text: string, isDesktop: boolean) => {
    const btn = hoursButtons.createEl("button", { text });
    setCssProps(btn, {
      width: isDesktop ? "36px" : "32px",
      height: isDesktop ? "36px" : "32px",
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
    });
    btn.addEventListener("mouseenter", () => {
      setCssProps(btn, {
        background: "var(--background-modifier-hover)",
        borderColor: "var(--interactive-accent)",
      });
    });
    btn.addEventListener("mouseleave", () => {
      setCssProps(btn, {
        background: "var(--background-primary)",
        borderColor: "var(--background-modifier-border)",
      });
    });
    return btn;
  };

  const hoursDecreaseBtn = createTimeButton("−", isDesktop);
  const hoursIncreaseBtn = createTimeButton("+", isDesktop);

  // Separador
  const colonEl = timePickerContainer.createEl("div", {
    text: ":",
  });
  setCssProps(colonEl, {
    fontSize: isDesktop ? "32px" : "28px",
    fontWeight: "600",
    color: "var(--text-normal)",
    margin: `0 ${isDesktop ? "10px" : "5px"}`,
  });

  // Selector de minutos
  const minutesContainer = timePickerContainer.createEl("div");
  setCssProps(minutesContainer, {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
  });

  const minutesLabel = minutesContainer.createEl("div", {
    text: getTranslation(language, "datePicker.minutes"),
  });
  setCssProps(minutesLabel, {
    fontSize: "11px",
    color: "var(--text-muted)",
    textTransform: "uppercase",
    fontWeight: "500",
    letterSpacing: "0.5px",
  });

  const minutesDisplay = minutesContainer.createEl("div", {
    text: "00",
  });
  setCssProps(minutesDisplay, {
    fontSize: isDesktop ? "32px" : "28px",
    fontWeight: "600",
    color: "var(--text-normal)",
    minWidth: isDesktop ? "60px" : "50px",
    textAlign: "center",
    padding: isDesktop ? "10px 15px" : "8px 12px",
    background: "var(--background-primary)",
    borderRadius: "6px",
    border: "2px solid var(--interactive-accent)",
  });
  minutesDisplay.id = "minutes-display";

  const minutesButtons = minutesContainer.createEl("div");
  setCssProps(minutesButtons, {
    display: "flex",
    gap: "8px",
    alignItems: "center",
    justifyContent: "center",
  });

  const minutesDecreaseBtn = createTimeButton("−", isDesktop);
  const minutesIncreaseBtn = createTimeButton("+", isDesktop);

  // Input oculto para mantener compatibilidad
  const timeInput = timeContainer.createEl("input", {
    type: "time",
    cls: "notelert-time-input"
  });
  setCssProps(timeInput, { display: "none" });
  timeInput.id = "hidden-time-input";

  // Funciones para actualizar hora/minutos
  const updateHours = (delta: number) => {
    const currentHours = parseInt(hoursDisplay.textContent || "12");
    const currentMinutes = parseInt(minutesDisplay.textContent || "0");
    let newHours = currentHours + delta;
    if (newHours < 0) newHours = 23;
    if (newHours > 23) newHours = 0;
    updateTimeDisplay(newHours, currentMinutes, hoursDisplay, minutesDisplay, timeInput);
  };

  const updateMinutes = (delta: number) => {
    const currentHours = parseInt(hoursDisplay.textContent || "12");
    const currentMinutes = parseInt(minutesDisplay.textContent || "0");
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

  hoursDecreaseBtn.addEventListener("click", () => updateHours(-1));
  hoursIncreaseBtn.addEventListener("click", () => updateHours(1));
  minutesDecreaseBtn.addEventListener("click", () => updateMinutes(-5));
  minutesIncreaseBtn.addEventListener("click", () => updateMinutes(5));

  // Botones rápidos de hora (solo en desktop)
  if (isDesktop) {
    const quickTimeButtons = timeContainer.createEl("div");
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
      const btn = quickTimeButtons.createEl("button", {
        text: qt.label,
      });
      setCssProps(btn, {
        padding: "6px 12px",
        fontSize: "12px",
        borderRadius: "4px",
        border: "1px solid var(--background-modifier-border)",
        background: "var(--background-primary)",
        cursor: "pointer",
        transition: "all 0.2s",
      });
      btn.addEventListener("click", () => {
        updateTimeDisplay(qt.hours, qt.minutes, hoursDisplay, minutesDisplay, timeInput);
      });
      btn.addEventListener("mouseenter", () => {
        setCssProps(btn, {
          background: "var(--background-modifier-hover)",
          borderColor: "var(--interactive-accent)",
        });
      });
      btn.addEventListener("mouseleave", () => {
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

