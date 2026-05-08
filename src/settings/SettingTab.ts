import { App, Plugin, PluginSettingTab, Setting, SettingDefinitionItem } from "obsidian";
import { INotelertPlugin } from "../core/plugin-interface";
import { SUPPORTED_LANGUAGES, getTranslation } from "../i18n";

// Obsidian's runtime supports getSettingDefinitions(), but the generated type
// definitions still model PluginSettingTab as abstract.
const PluginSettingTabBase = PluginSettingTab as unknown as new (
  app: App,
  plugin: Plugin & INotelertPlugin
) => PluginSettingTab;

export class NotelertSettingTab extends PluginSettingTabBase {
  plugin: INotelertPlugin;
  private readonly bannerDismissedKey = "notelert-app-required-banner-dismissed";

  constructor(app: App, plugin: Plugin & INotelertPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  private hasPluginToken(): boolean {
    return !!this.plugin.settings.pluginToken?.trim();
  }

  private shouldShowAppRequiredBanner(): boolean {
    return !this.hasPluginToken() && this.app.loadLocalStorage(this.bannerDismissedKey) !== "true";
  }

  private renderAppRequiredBanner(setting: Setting): void {
    const bannerContainer = setting.settingEl.createEl("div", {
      attr: {
        style: `
          padding: 15px;
          background: var(--background-secondary);
          border-radius: 8px;
          border-left: 4px solid var(--text-warning);
          position: relative;
        `
      }
    });

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
      this.app.saveLocalStorage(this.bannerDismissedKey, "true");
      this.update();
    };

    bannerContainer.createEl("p", {
      text:
        getTranslation(this.plugin.settings.language, "settings.appRequired.message") ||
        "Este plugin requiere instalar la app de Android para funcionar. Una vez instalada, genera un token desde Settings > Plugin Token en la app y configúralo aquí.",
      attr: {
        style: "margin: 0 0 10px 0; color: var(--text-muted); font-size: 13px; line-height: 1.6;"
      }
    });

    bannerContainer.createEl("a", {
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

  getSettingDefinitions(): SettingDefinitionItem[] {
    const language = this.plugin.settings.language;
    const definitions: SettingDefinitionItem[] = [];

    if (this.shouldShowAppRequiredBanner()) {
      definitions.push({
        type: "group",
        heading: getTranslation(language, "settings.appRequired.title") || "App requerida",
        items: [
          {
            name: "",
            searchable: false,
            render: (setting) => {
              setting.settingEl.empty();
              this.renderAppRequiredBanner(setting);
            }
          }
        ]
      });
    }

    definitions.push(
      {
        type: "group",
        heading: getTranslation(language, "settings.basicSettings"),
        items: [
          {
            name: getTranslation(language, "settings.language"),
            desc: getTranslation(language, "settings.languageDesc"),
            render: (setting) => {
              setting.addDropdown((dropdown) => {
                SUPPORTED_LANGUAGES.forEach((lang) => {
                  dropdown.addOption(lang.code, `${lang.nativeName} (${lang.name})`);
                });
                dropdown.setValue(this.plugin.settings.language);
                dropdown.onChange((value) => {
                  void (async () => {
                    this.plugin.settings.language = value;
                    await this.plugin.saveSettings();
                    this.update();
                  })();
                });
              });
            }
          },
          {
            name: getTranslation(language, "settings.debugMode"),
            desc: getTranslation(language, "settings.debugModeDesc"),
            render: (setting) => {
              setting.addToggle((toggle) =>
                toggle
                  .setValue(this.plugin.settings.debugMode)
                  .onChange((value) => {
                    void (async () => {
                      this.plugin.settings.debugMode = value;
                      await this.plugin.saveSettings();
                    })();
                  })
              );
            }
          }
        ]
      },
      {
        type: "group",
        heading: getTranslation(language, "settings.pluginToken.title"),
        items: [
          {
            name: getTranslation(language, "settings.pluginToken.title"),
            desc:
              getTranslation(language, "settings.pluginToken.descDesktop") ||
              "Token de autenticación para usar geocodificación y emails premium. Obtén tu token desde la app móvil en Settings > Plugin Token.",
            render: (setting) => {
              setting.addText((text) => {
                text
                  .setPlaceholder(getTranslation(language, "settings.pluginToken.placeholder"))
                  .setValue(this.plugin.settings.pluginToken || "")
                  .inputEl.type = "password";
                text.onChange((value) => {
                  void (async () => {
                    this.plugin.settings.pluginToken = value.trim();
                    this.app.saveLocalStorage(this.bannerDismissedKey, null);
                    await this.plugin.saveSettings();
                    this.update();
                  })();
                });
              });
              setting.addButton((button) => {
                button
                  .setButtonText(getTranslation(language, "settings.pluginToken.showHide"))
                  .onClick(() => {
                    const input = setting.settingEl.querySelector<HTMLInputElement>('input[type="password"], input[type="text"]');
                    if (input) {
                      input.type = input.type === "password" ? "text" : "password";
                    }
                  });
              });
            }
          }
        ]
      },
      {
        type: "group",
        heading: getTranslation(language, "settings.generalSettings.title") || "Configuración General",
        items: [
          {
            name: "Combinación de caracteres para abrir el modal",
            desc: "Escribe la combinación de caracteres que quieres usar para abrir el modal de notificaciones (por defecto: :@)",
            render: (setting) => {
              setting.addText((text) => {
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
        ]
      }
    );

    return definitions;
  }
}
