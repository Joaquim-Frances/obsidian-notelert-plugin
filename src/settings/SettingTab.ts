import { App, Plugin, PluginSettingTab, Setting } from "obsidian";
import { INotelertPlugin } from "../core/plugin-interface";
import { SUPPORTED_LANGUAGES, getTranslation } from "../i18n";

export class NotelertSettingTab extends PluginSettingTab {
  plugin: INotelertPlugin;

  constructor(app: App, plugin: Plugin & INotelertPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    // Título principal como heading de Setting
    new Setting(containerEl)
      .setName(getTranslation(this.plugin.settings.language, "settings.title"))
      .setHeading();

    // ========== BANNER INFORMATIVO: APP REQUERIDA ==========
    // Mostrar banner si no hay token configurado (siempre visible hasta que se configure el token)
    const hasToken = this.plugin.settings.pluginToken && this.plugin.settings.pluginToken.trim().length > 0;
    const bannerDismissedKey = "notelert-app-required-banner-dismissed";
    const bannerDismissed = localStorage.getItem(bannerDismissedKey) === "true";

    // Mostrar el banner si no hay token (incluso si fue cerrado previamente, para recordar al usuario)
    if (!hasToken) {
      const bannerContainer = containerEl.createEl("div", {
        attr: {
          style: `
            padding: 15px;
            margin-bottom: 20px;
            background: var(--background-secondary);
            border-radius: 8px;
            border-left: 4px solid var(--text-warning);
            position: relative;
          `
        }
      });

      // Botón de cerrar
      const closeButton = bannerContainer.createEl("button", {
        attr: {
          style: `
            position: absolute;
            top: 10px;
            right: 10px;
            background: transparent;
            border: none;
            color: var(--text-muted);
            cursor: pointer;
            font-size: 18px;
            padding: 4px 8px;
            line-height: 1;
          `
        },
        text: "×"
      });
      closeButton.onclick = () => {
        localStorage.setItem(bannerDismissedKey, "true");
        this.display(); // Recargar para ocultar el banner
      };

      // Título del banner
      bannerContainer.createEl("h3", {
        text: getTranslation(this.plugin.settings.language, "settings.appRequired.title") || "📱 App de Android Requerida",
        attr: { 
          style: "margin: 0 0 10px 0; color: var(--text-normal); font-size: 16px; font-weight: 600;" 
        }
      });

      // Mensaje del banner
      const messageText = getTranslation(this.plugin.settings.language, "settings.appRequired.message") || 
        "Este plugin requiere instalar la app de Android para funcionar. Una vez instalada, genera un token desde Settings > Plugin Token en la app y configúralo aquí.";
      
      bannerContainer.createEl("p", {
        text: messageText,
        attr: { 
          style: "margin: 0 0 10px 0; color: var(--text-muted); font-size: 13px; line-height: 1.6;" 
        }
      });

      // Enlace a descargar
      const downloadLink = bannerContainer.createEl("a", {
        text: getTranslation(this.plugin.settings.language, "settings.appRequired.downloadLink") || "Descargar app de Android",
        attr: {
          href: "https://play.google.com/store/apps/details?id=com.notelert",
          target: "_blank",
          style: `
            display: inline-block;
            margin-top: 5px;
            color: var(--text-accent);
            text-decoration: none;
            font-weight: 500;
          `
        }
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

    // ========== TOKEN DEL PLUGIN ==========
    new Setting(containerEl)
      .setName(getTranslation(this.plugin.settings.language, "settings.pluginToken.title"))
      .setHeading();

    // Token del Plugin (REQUERIDO para premium features)
    const tokenDesc = getTranslation(this.plugin.settings.language, "settings.pluginToken.descDesktop") || 
      "Token de autenticación para usar geocodificación y emails premium. Obtén tu token desde la app móvil en Settings > Plugin Token.";

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
