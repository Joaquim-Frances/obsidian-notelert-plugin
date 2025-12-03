import { App, Modal } from "obsidian";
import { DetectedPattern } from "../core/types";
import { getTranslation } from "../i18n";
import { setCssProps } from "../core/dom";

export class NotelertConfirmationModal extends Modal {
  private pattern: DetectedPattern;
  private onConfirm: (pattern: DetectedPattern) => void;
  private onCancel: () => void;
  private language: string;

  constructor(app: App, pattern: DetectedPattern, language: string, onConfirm: (pattern: DetectedPattern) => void, onCancel: () => void) {
    super(app);
    this.pattern = pattern;
    this.language = language;
    this.onConfirm = onConfirm;
    this.onCancel = onCancel;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl("h2", { text: getTranslation(this.language, "modal.title") });

    // Mostrar información de la notificación
    const infoDiv = contentEl.createEl("div", { cls: "notelert-modal-info" });
    setCssProps(infoDiv, {
      margin: "20px 0",
      padding: "15px",
      background: "var(--background-secondary)",
      borderRadius: "6px",
    });
    
    const titleP = infoDiv.createEl("p", { text: `${getTranslation(this.language, "modal.titleLabel")} ${this.pattern.title}` });
    setCssProps(titleP, {
      margin: "8px 0",
      fontWeight: "500",
    });
    
    const dateP = infoDiv.createEl("p", { text: `${getTranslation(this.language, "modal.dateLabel")} ${this.pattern.date}` });
    setCssProps(dateP, { margin: "8px 0" });
    
    const timeP = infoDiv.createEl("p", { text: `${getTranslation(this.language, "modal.timeLabel")} ${this.pattern.time}` });
    setCssProps(timeP, { margin: "8px 0" });
    
    const messageP = infoDiv.createEl("p", { text: `${getTranslation(this.language, "modal.messageLabel")} ${this.pattern.message}` });
    setCssProps(messageP, { margin: "8px 0" });

    // Botones con mejor espaciado
    const buttonContainer = contentEl.createEl("div", { cls: "notelert-modal-buttons" });
    setCssProps(buttonContainer, {
      display: "flex",
      gap: "12px",
      justifyContent: "flex-end",
      marginTop: "20px",
    });
    
    const cancelButton = buttonContainer.createEl("button", { 
      text: getTranslation(this.language, "modal.cancelButton"),
      cls: "mod-secondary"
    });
    cancelButton.addEventListener("click", () => {
      this.onCancel();
      this.close();
    });

    const confirmButton = buttonContainer.createEl("button", { 
      text: getTranslation(this.language, "modal.confirmButton"),
      cls: "mod-cta"
    });
    confirmButton.addEventListener("click", () => {
      this.onConfirm(this.pattern);
      this.close();
    });
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}

