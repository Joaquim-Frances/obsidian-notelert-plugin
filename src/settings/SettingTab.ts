import { App, Plugin, PluginSettingTab, Setting, Platform } from "obsidian";
import { INotelertPlugin } from "../core/plugin-interface";
import { SUPPORTED_LANGUAGES, getTranslation } from "../i18n";
import { setCssProps } from "../core/dom";
import { isIOS, getMobilePlatform } from "../features/notifications/utils";

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
    const mobilePlatform = getMobilePlatform();
    const isIOSDevice = isIOS();

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
    } else if (isIOSDevice) {
      // Información específica para iOS
      new Setting(platformInfo)
        .setName(getTranslation(this.plugin.settings.language, "settings.platformInfo.iosTitle") || "iOS detectado")
        .setHeading();
      platformInfo.createEl("p", {
        text: getTranslation(this.plugin.settings.language, "settings.platformInfo.iosDesc") || 
          "Notelert actualmente solo está disponible para Android. La app de iOS está en desarrollo. " +
          "Por favor, usa un dispositivo Android para crear notificaciones push.",
        attr: { style: "margin: 0; color: var(--text-warning); font-size: 13px; line-height: 1.5;" }
      });
    } else {
      // Android u otra plataforma móvil
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


}
