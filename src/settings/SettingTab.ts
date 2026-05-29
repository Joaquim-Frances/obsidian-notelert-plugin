import { App, Plugin, PluginSettingTab, Setting } from "obsidian";
import { INotelertPlugin } from "../core/plugin-interface";
import { SUPPORTED_LANGUAGES, getTranslation } from "../i18n";
import { createDiv, createEl } from "../core/dom";

const CONTACT_EMAIL = "notelert@proton.me";
const CONTACT_MAILTO_URL = `mailto:${CONTACT_EMAIL}?subject=Notelert%20Contact%20%26%20feedback`;

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

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    const language = this.plugin.settings.language;

    if (this.shouldShowAppRequiredBanner()) {
      this.renderLegacyBanner(containerEl, language);
    }

    this.renderLegacySection(containerEl, getTranslation(language, "settings.basicSettings"));
    new Setting(containerEl)
      .setName(getTranslation(language, "settings.language"))
      .setDesc(getTranslation(language, "settings.languageDesc"))
      .addDropdown((dropdown) => {
        SUPPORTED_LANGUAGES.forEach((lang) => {
          dropdown.addOption(lang.code, `${lang.nativeName} (${lang.name})`);
        });
        dropdown.setValue(this.plugin.settings.language);
        dropdown.onChange((value) => {
          void (async () => {
            this.plugin.settings.language = value;
            await this.plugin.saveSettings();
            this.display();
          })();
        });
      });

    this.renderLegacySection(containerEl, getTranslation(language, "settings.pluginToken.title"));
    let pluginTokenInput: HTMLInputElement | null = null;
    new Setting(containerEl)
      .setName(getTranslation(language, "settings.pluginToken.title"))
      .setDesc(
        getTranslation(language, "settings.pluginToken.descDesktop") ||
          "Token que vincula el plugin con la app para poder usar las notificaciones."
      )
      .addText((text) => {
        text
          .setPlaceholder(getTranslation(language, "settings.pluginToken.placeholder"))
          .setValue(this.plugin.settings.pluginToken || "")
          .inputEl.type = "password";
        pluginTokenInput = text.inputEl;
        text.onChange((value) => {
          void (async () => {
            this.plugin.settings.pluginToken = value.trim();
            this.app.saveLocalStorage(this.bannerDismissedKey, null);
            await this.plugin.saveSettings();
            this.display();
          })();
        });
      })
      .addButton((button) => {
        button
          .setButtonText(getTranslation(language, "settings.pluginToken.showHide"))
          .onClick(() => {
            if (pluginTokenInput) {
              pluginTokenInput.type = pluginTokenInput.type === "password" ? "text" : "password";
            }
          });
      });

    this.renderLegacySection(containerEl, getTranslation(language, "settings.generalSettings.title"));
    new Setting(containerEl)
      .setName(getTranslation(language, "settings.generalSettings.datePickerTriggerTitle"))
      .setDesc(getTranslation(language, "settings.generalSettings.datePickerTriggerDesc"))
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

    this.renderLegacySection(
      containerEl,
      getTranslation(language, "settings.contactFeedback.title") || "Contact & feedback"
    );
    new Setting(containerEl)
      .setName(getTranslation(language, "settings.contactFeedback.title") || "Contact & feedback")
      .setDesc(
        getTranslation(language, "settings.contactFeedback.desc", { email: CONTACT_EMAIL }) ||
          `Questions, issues, or suggestions: ${CONTACT_EMAIL}`
      )
      .addButton((button) => {
        button
          .setButtonText(getTranslation(language, "settings.contactFeedback.button") || "Email")
          .onClick(() => {
            window.open(CONTACT_MAILTO_URL);
          });
      });
  }

  private renderLegacySection(containerEl: HTMLElement, heading: string): void {
    const headingEl = createEl(containerEl, "h3", {
      text: heading,
    });
    headingEl.addClass("notelert-legacy-section-heading");
  }

  private renderLegacyBanner(containerEl: HTMLElement, language: string): void {
    const bannerContainer = createDiv(containerEl, {
      attr: {
        style: `
          padding: 15px;
          background: var(--background-secondary);
          border-radius: 8px;
          border-left: 4px solid var(--text-warning);
          position: relative;
          padding-right: 56px;
          margin-bottom: 1rem;
        `
      }
    });

    const closeButton = createEl(bannerContainer, "button", {
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
      this.display();
    };

    createEl(bannerContainer, "p", {
      text: getTranslation(language, "settings.appRequired.message"),
      attr: {
        style: "margin: 0 0 10px 0; color: var(--text-muted); font-size: 13px; line-height: 1.6; max-width: 68ch;"
      }
    });

    createEl(bannerContainer, "a", {
      text: getTranslation(language, "settings.appRequired.downloadLink"),
      attr: {
        href: "https://play.google.com/store/apps/details?id=com.quim79.notelert",
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
}
