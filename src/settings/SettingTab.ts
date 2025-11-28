import { App, Plugin, PluginSettingTab, Setting, Modal, Platform, Notice } from "obsidian";
import { INotelertPlugin } from "../core/plugin-interface";
import { SUPPORTED_LANGUAGES, getTranslation } from "../i18n";
import { ScheduledEmail } from "../core/types";
import { cancelScheduledEmail } from "../features/notifications/firebase-api";
import { setCssProps } from "../core/dom";

export class NotelertSettingTab extends PluginSettingTab {
  plugin: INotelertPlugin;

  constructor(app: App, plugin: Plugin & INotelertPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    const isDesktop = !Platform.isMobile;

    // Título principal como heading de Setting
    new Setting(containerEl)
      .setName(getTranslation(this.plugin.settings.language, "settings.title"))
      .setHeading();

    // ========== INFORMACIÓN SOBRE PLATAFORMA ==========
    const platformInfo = containerEl.createEl("div", {
      attr: {
        style: `
          padding: 15px;
          margin-bottom: 20px;
          background: var(--background-secondary);
          border-radius: 8px;
          border-left: 4px solid var(--interactive-accent);
        `
      }
    });

    if (isDesktop) {
      new Setting(platformInfo)
        .setName(getTranslation(this.plugin.settings.language, "settings.platformInfo.desktopTitle"))
        .setHeading();
      platformInfo.createEl("p", {
        text: getTranslation(this.plugin.settings.language, "settings.platformInfo.desktopDesc"),
        attr: { style: "margin: 0; color: var(--text-muted); font-size: 13px; line-height: 1.5;" }
      });
    } else {
      new Setting(platformInfo)
        .setName(getTranslation(this.plugin.settings.language, "settings.platformInfo.mobileTitle"))
        .setHeading();
      platformInfo.createEl("p", {
        text: getTranslation(this.plugin.settings.language, "settings.platformInfo.mobileDesc"),
        attr: { style: "margin: 0; color: var(--text-muted); font-size: 13px; line-height: 1.5;" }
      });
    }

    // ========== CONFIGURACIÓN BÁSICA ==========
    new Setting(containerEl)
      .setName(getTranslation(this.plugin.settings.language, "settings.basicSettings"))
      .setHeading();

    // Selector de idioma
    new Setting(containerEl)
      .setName(getTranslation(this.plugin.settings.language, "settings.language"))
      .setDesc(getTranslation(this.plugin.settings.language, "settings.languageDesc"))
      .addDropdown((dropdown) => {
        SUPPORTED_LANGUAGES.forEach(lang => {
          dropdown.addOption(lang.code, `${lang.nativeName} (${lang.name})`);
        });
        dropdown.setValue(this.plugin.settings.language);
        dropdown.onChange((value) => {
          void (async () => {
            this.plugin.settings.language = value;
            await this.plugin.saveSettings();
            this.display(); // Recargar para actualizar traducciones
          })();
        });
      });

    // Modo debug
    new Setting(containerEl)
      .setName(getTranslation(this.plugin.settings.language, "settings.debugMode"))
      .setDesc(getTranslation(this.plugin.settings.language, "settings.debugModeDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.debugMode)
          .onChange((value) => {
            void (async () => {
              this.plugin.settings.debugMode = value;
              await this.plugin.saveSettings();
            })();
          })
      );

    // ========== TOKEN DEL PLUGIN (DESKTOP Y MÓVIL) ==========
    new Setting(containerEl)
      .setName(getTranslation(this.plugin.settings.language, "settings.pluginToken.title"))
      .setHeading();

    // Token del Plugin (REQUERIDO para premium features)
    const tokenDesc = isDesktop
      ? getTranslation(this.plugin.settings.language, "settings.pluginToken.descDesktop")
      : getTranslation(this.plugin.settings.language, "settings.pluginToken.descMobile");

    new Setting(containerEl)
      .setName(getTranslation(this.plugin.settings.language, "settings.pluginToken.title"))
      .setDesc(tokenDesc)
      .addText((text) => {
        text
          .setPlaceholder(getTranslation(this.plugin.settings.language, "settings.pluginToken.placeholder"))
          .setValue(this.plugin.settings.pluginToken || "")
          .inputEl.type = "password";
        text.onChange((value) => {
          void (async () => {
            this.plugin.settings.pluginToken = value.trim();
            await this.plugin.saveSettings();
          })();
        });
      })
      .addButton((button) => {
        button
          .setButtonText(getTranslation(this.plugin.settings.language, "settings.pluginToken.showHide"))
          .setCta(false)
          .onClick(() => {
            const input = containerEl.querySelector<HTMLInputElement>('input[type="password"]');
            if (input) {
              input.type = input.type === "password" ? "text" : "password";
            }
          });
      });

    // ========== CONFIGURACIÓN DESKTOP ==========
    if (isDesktop) {
      new Setting(containerEl)
        .setName(getTranslation(this.plugin.settings.language, "settings.desktopSettings.title"))
        .setHeading();

      // Email del usuario (DEPRECATED pero mantener por compatibilidad)
      new Setting(containerEl)
        .setName(getTranslation(this.plugin.settings.language, "settings.desktopSettings.userEmailTitle"))
        .setDesc(getTranslation(this.plugin.settings.language, "settings.desktopSettings.userEmailDesc"))
        .addText((text) => {
          text
            .setPlaceholder(getTranslation(this.plugin.settings.language, "settings.desktopSettings.userEmailPlaceholder"))
            .setValue(this.plugin.settings.userEmail || "")
            .onChange((value) => {
              void (async () => {
                this.plugin.settings.userEmail = value;
                await this.plugin.saveSettings();
              })();
            });
        });

      // Lista de emails programados
      new Setting(containerEl)
        .setName(getTranslation(this.plugin.settings.language, "settings.scheduledEmails.title"))
        .setHeading();

      const emailsDesc = containerEl.createEl("p", {
        text: getTranslation(this.plugin.settings.language, "settings.scheduledEmails.desc"),
        attr: { style: "color: var(--text-muted); font-size: 13px; margin-bottom: 15px;" }
      });

      const emailsContainer = containerEl.createEl("div", {
        attr: {
          style: `
            margin: 15px 0;
            padding: 15px;
            background: var(--background-secondary);
            border-radius: 8px;
            border: 1px solid var(--background-modifier-border);
          `
        }
      });

      this.renderScheduledEmails(emailsContainer);
    }

    // ========== CONFIGURACIÓN GENERAL ==========
    new Setting(containerEl)
      .setName(getTranslation(this.plugin.settings.language, "settings.generalSettings.title") || "Configuración General")
      .setHeading();

    // Trigger personalizado para el date picker
    new Setting(containerEl)
      .setName("Combinación de caracteres para abrir el modal")
      .setDesc("Escribe la combinación de caracteres que quieres usar para abrir el modal de notificaciones (por defecto: :@)")
      .addText((text) => {
        text
          .setPlaceholder(":@")
          .setValue(this.plugin.settings.datePickerTrigger || ":@")
          .onChange((value) => {
            void (async () => {
              this.plugin.settings.datePickerTrigger = value.trim() || ":@";
              await this.plugin.saveSettings();
            })();
          });
      });
  }

  // Renderizar lista de emails programados
  private renderScheduledEmails(container: HTMLElement) {
    container.empty();

    const emails = this.plugin.settings.scheduledEmails || [];

    if (emails.length === 0) {
      container.createEl("p", {
        text: getTranslation(this.plugin.settings.language, "settings.scheduledEmails.empty"),
        attr: { style: "color: var(--text-muted); text-align: center; padding: 20px;" }
      });
      return;
    }

    // Ordenar por fecha programada (más próximos primero)
    const sortedEmails = [...emails].sort((a, b) =>
      new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
    );

    sortedEmails.forEach((email, index) => {
      const emailItem = container.createEl("div", {
        attr: {
          style: `
            padding: 12px;
            margin: 8px 0;
            border: 1px solid var(--background-modifier-border);
            border-radius: 6px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 10px;
            background: var(--background-primary);
          `
        }
      });

      const emailInfo = emailItem.createEl("div", {
        attr: { style: "flex: 1; min-width: 200px;" }
      });

      emailInfo.createEl("div", {
        text: email.title,
        attr: { style: "font-weight: 500; margin-bottom: 4px; font-size: 14px;" }
      });

      if (email.message) {
        emailInfo.createEl("div", {
          text: email.message.length > 60 ? email.message.substring(0, 60) + "..." : email.message,
          attr: { style: "font-size: 12px; color: var(--text-muted); margin-bottom: 4px; word-wrap: break-word;" }
        });
      }

      const scheduledDate = new Date(email.scheduledDate);
      const now = new Date();
      const isPast = scheduledDate < now;

      emailInfo.createEl("div", {
        text: `📅 ${scheduledDate.toLocaleString('es-ES', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })} ${isPast ? getTranslation(this.plugin.settings.language, "settings.scheduledEmails.past") : ''}`,
        attr: {
          style: `font-size: 11px; color: ${isPast ? 'var(--text-error)' : 'var(--text-muted)'};`
        }
      });

      const buttonsContainer = emailItem.createEl("div", {
        attr: { style: "display: flex; gap: 6px; flex-shrink: 0;" }
      });

      const cancelButton = buttonsContainer.createEl("button", {
        text: getTranslation(this.plugin.settings.language, "settings.scheduledEmails.cancelButton"),
        attr: {
          style: "padding: 6px 12px; font-size: 12px; white-space: nowrap; color: var(--text-error);",
          id: `cancel-email-btn-${email.notificationId}`
        }
      });
      cancelButton.addEventListener("click", () => {
        void (async () => {
          // Encontrar el índice real en la lista original
          const realIndex = emails.findIndex(e => e.notificationId === email.notificationId);
          await this.cancelScheduledEmail(email, realIndex, cancelButton);
        })();
      });
    });
  }

  // Cancelar email programado
  private async cancelScheduledEmail(email: ScheduledEmail, index: number, button?: HTMLButtonElement) {
    // NOTA: cancelScheduledEmail todavía requiere API key del endpoint antiguo
    // TODO: Crear endpoint /plugin/cancelEmail que use autenticación por usuario
    // Por ahora, si no hay API key configurada, mostrar error
    const apiKey = this.plugin.settings.notelertApiKey;

    if (!apiKey) {
      new Notice("❌ Para cancelar emails, necesitas configurar una API key en Settings (o esperar a que se envíe automáticamente).");
      return;
    }

    // Mostrar spinner en el botón si está disponible
    if (button) {
      this.showLoadingState(button);
    }

    // Mostrar feedback visual inmediato
    const loadingNotice = new Notice("⏳ Cancelando email...", 0); // 0 = no auto-close

    try {
      const result = await cancelScheduledEmail(
        email.notificationId,
        apiKey
      );

      // Cerrar el notice de carga
      loadingNotice.hide();

      // Restaurar botón
      if (button) {
        this.hideLoadingState(button);
      }

      if (result.success) {
        // Eliminar de la lista local
        this.plugin.settings.scheduledEmails.splice(index, 1);
        await this.plugin.saveSettings();
        this.display(); // Recargar para actualizar la lista
        new Notice(getTranslation(this.plugin.settings.language, "settings.scheduledEmails.cancelSuccess"));
      } else {
        new Notice(`❌ Error: ${result.error || getTranslation(this.plugin.settings.language, "settings.scheduledEmails.cancelError")}`);
      }
    } catch (error) {
      // Cerrar el notice de carga
      loadingNotice.hide();

      // Restaurar botón en caso de error
      if (button) {
        this.hideLoadingState(button);
      }

      new Notice(`❌ Error: ${error instanceof Error ? error.message : getTranslation(this.plugin.settings.language, "settings.scheduledEmails.cancelError")}`);
    }
  }

  // Mostrar estado de carga (spinner) en el botón
  private showLoadingState(button: HTMLButtonElement) {
    // Guardar el texto original
    (button as HTMLButtonElement & { __originalText?: string }).__originalText = button.textContent || undefined;

    // Deshabilitar botón
    button.disabled = true;
    setCssProps(button, {
      opacity: '0.6',
      cursor: 'not-allowed',
    });

    // Texto de carga sencillo
    button.textContent = getTranslation(this.plugin.settings.language, "settings.scheduledEmails.canceling");
  }

  // Ocultar estado de carga y restaurar botón
  private hideLoadingState(button: HTMLButtonElement) {
    // Restaurar texto original
    const originalText =
      (button as HTMLButtonElement & { __originalText?: string }).__originalText ||
      getTranslation(this.plugin.settings.language, "settings.scheduledEmails.cancelButton");
    button.textContent = originalText;

    // Restaurar estado del botón
    button.disabled = false;
    setCssProps(button, {
      opacity: '1',
      cursor: 'pointer',
    });
  }

}
