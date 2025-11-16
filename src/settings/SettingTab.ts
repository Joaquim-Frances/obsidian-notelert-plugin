import { App, Plugin, PluginSettingTab, Setting } from "obsidian";
import { INotelertPlugin } from "../core/plugin-interface";
import { SUPPORTED_LANGUAGES, getTranslation, getLanguageByCode, getDefaultLanguage } from "../i18n";

export class NotelertSettingTab extends PluginSettingTab {
  plugin: INotelertPlugin;

  constructor(app: App, plugin: Plugin & INotelertPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    const currentLanguage = getLanguageByCode(this.plugin.settings.language) || getDefaultLanguage();

    containerEl.createEl("h2", { text: getTranslation(this.plugin.settings.language, "settings.title") });

    // Selector de idioma
    new Setting(containerEl)
      .setName(getTranslation(this.plugin.settings.language, "settings.language"))
      .setDesc(getTranslation(this.plugin.settings.language, "settings.languageDesc"))
      .addDropdown((dropdown) => {
        SUPPORTED_LANGUAGES.forEach(lang => {
          dropdown.addOption(lang.code, `${lang.nativeName} (${lang.name})`);
        });
        dropdown.setValue(this.plugin.settings.language);
        dropdown.onChange(async (value) => {
          this.plugin.settings.language = value;
          await this.plugin.saveSettings();
          // Recargar la configuración para actualizar las traducciones
          this.display();
        });
      });

    // Procesamiento automático
    new Setting(containerEl)
      .setName(getTranslation(this.plugin.settings.language, "settings.autoProcess"))
      .setDesc(getTranslation(this.plugin.settings.language, "settings.autoProcessDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.autoProcess)
          .onChange(async (value) => {
            this.plugin.settings.autoProcess = value;
            await this.plugin.saveSettings();
          })
      );

    // Procesar al guardar
    new Setting(containerEl)
      .setName(getTranslation(this.plugin.settings.language, "settings.processOnSave"))
      .setDesc(getTranslation(this.plugin.settings.language, "settings.processOnSaveDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.processOnSave)
          .onChange(async (value) => {
            this.plugin.settings.processOnSave = value;
            await this.plugin.saveSettings();
          })
      );

    // Procesar al abrir
    new Setting(containerEl)
      .setName(getTranslation(this.plugin.settings.language, "settings.processOnOpen"))
      .setDesc(getTranslation(this.plugin.settings.language, "settings.processOnOpenDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.processOnOpen)
          .onChange(async (value) => {
            this.plugin.settings.processOnOpen = value;
            await this.plugin.saveSettings();
          })
      );

    // Modo debug
    new Setting(containerEl)
      .setName(getTranslation(this.plugin.settings.language, "settings.debugMode"))
      .setDesc(getTranslation(this.plugin.settings.language, "settings.debugModeDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.debugMode)
          .onChange(async (value) => {
            this.plugin.settings.debugMode = value;
            await this.plugin.saveSettings();
          })
      );

    // Usar debounce
    new Setting(containerEl)
      .setName(getTranslation(this.plugin.settings.language, "settings.useDebounce"))
      .setDesc(getTranslation(this.plugin.settings.language, "settings.useDebounceDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.useDebounce)
          .onChange(async (value) => {
            this.plugin.settings.useDebounce = value;
            await this.plugin.saveSettings();
          })
      );

    // Tiempo de debounce
    new Setting(containerEl)
      .setName(getTranslation(this.plugin.settings.language, "settings.debounceDelay"))
      .setDesc(getTranslation(this.plugin.settings.language, "settings.debounceDelayDesc"))
      .addSlider((slider) =>
        slider
          .setLimits(1, 10, 1)
          .setValue(this.plugin.settings.debounceDelay / 1000)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.debounceDelay = value * 1000;
            await this.plugin.saveSettings();
          })
      );

    // Modal de confirmación
    new Setting(containerEl)
      .setName(getTranslation(this.plugin.settings.language, "settings.showConfirmationModal"))
      .setDesc(getTranslation(this.plugin.settings.language, "settings.showConfirmationModalDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showConfirmationModal)
          .onChange(async (value) => {
            this.plugin.settings.showConfirmationModal = value;
            await this.plugin.saveSettings();
          })
      );

    // Iconos visuales
    new Setting(containerEl)
      .setName(getTranslation(this.plugin.settings.language, "settings.addVisualIndicators"))
      .setDesc(getTranslation(this.plugin.settings.language, "settings.addVisualIndicatorsDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.addVisualIndicators)
          .onChange(async (value) => {
            this.plugin.settings.addVisualIndicators = value;
            await this.plugin.saveSettings();
          })
      );

    // Icono visual personalizado
    new Setting(containerEl)
      .setName(getTranslation(this.plugin.settings.language, "settings.visualIndicatorIcon"))
      .setDesc(getTranslation(this.plugin.settings.language, "settings.visualIndicatorIconDesc"))
      .addText((text) =>
        text
          .setPlaceholder("⏰")
          .setValue(this.plugin.settings.visualIndicatorIcon)
          .onChange(async (value) => {
            this.plugin.settings.visualIndicatorIcon = value || "⏰";
            await this.plugin.saveSettings();
          })
      );

    // Nuevo sistema de sintaxis
    new Setting(containerEl)
      .setName(getTranslation(this.plugin.settings.language, "settings.useNewSyntax"))
      .setDesc(getTranslation(this.plugin.settings.language, "settings.useNewSyntaxDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.useNewSyntax)
          .onChange(async (value) => {
            this.plugin.settings.useNewSyntax = value;
            await this.plugin.saveSettings();
          })
      );

    // Date picker
    new Setting(containerEl)
      .setName(getTranslation(this.plugin.settings.language, "settings.enableDatePicker"))
      .setDesc(getTranslation(this.plugin.settings.language, "settings.enableDatePickerDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.enableDatePicker)
          .onChange(async (value) => {
            this.plugin.settings.enableDatePicker = value;
            await this.plugin.saveSettings();
          })
      );

    // Carpetas excluidas
    new Setting(containerEl)
      .setName(getTranslation(this.plugin.settings.language, "settings.excludedFolders"))
      .setDesc(getTranslation(this.plugin.settings.language, "settings.excludedFoldersDesc"))
      .addTextArea((text) =>
        text
          .setPlaceholder("Templates, Archive, Trash")
          .setValue(this.plugin.settings.excludedFolders.join(", "))
          .onChange(async (value) => {
            this.plugin.settings.excludedFolders = value
              .split(",")
              .map((folder) => folder.trim())
              .filter((folder) => folder.length > 0);
            await this.plugin.saveSettings();
          })
      );

    // Patrones personalizados
    new Setting(containerEl)
      .setName(getTranslation(this.plugin.settings.language, "settings.customPatterns"))
      .setDesc(getTranslation(this.plugin.settings.language, "settings.customPatternsDesc"))
      .addTextArea((text) =>
        text
          .setPlaceholder(currentLanguage.keywords.join(", "))
          .setValue(this.plugin.settings.customPatterns.join(", "))
          .onChange(async (value) => {
            this.plugin.settings.customPatterns = value
              .split(",")
              .map((pattern) => pattern.trim())
              .filter((pattern) => pattern.length > 0);
            await this.plugin.saveSettings();
          })
      );

    // Información sobre patrones soportados
    containerEl.createEl("h3", { text: getTranslation(this.plugin.settings.language, "settings.supportedPatterns") });
    
    const patternsInfo = containerEl.createEl("div", { 
      cls: "notelert-patterns-info" 
    });
    
    // Generar información dinámica basada en el idioma seleccionado
    const keywordsList = currentLanguage.keywords.map(kw => `"${kw}"`).join(", ");
    const todayWords = currentLanguage.datePatterns.today.join(", ");
    const tomorrowWords = currentLanguage.datePatterns.tomorrow.join(", ");
    const yesterdayWords = currentLanguage.datePatterns.yesterday.join(", ");
    
    patternsInfo.innerHTML = `
      <p><strong>${getTranslation(this.plugin.settings.language, "settings.keywords")}:</strong></p>
      <ul>
        <li>${keywordsList}</li>
      </ul>
      
      <p><strong>${getTranslation(this.plugin.settings.language, "settings.dates")}</strong></p>
      <ul>
        <li>Fechas absolutas: 12/10, 15/10/2025, 12-10-2025</li>
        <li>Fechas relativas: ${todayWords}, ${tomorrowWords}, ${yesterdayWords}</li>
      </ul>
      
      <p><strong>${getTranslation(this.plugin.settings.language, "settings.times")}</strong></p>
      <ul>
        <li>Formato 24h: 15:30, 9:00, 18:45</li>
        <li>Formato con punto: 15.30, 9.00</li>
      </ul>
      
      <p><strong>${getTranslation(this.plugin.settings.language, "settings.examples")}</strong></p>
      <ul>
        <li>"${currentLanguage.keywords[0]} Reunión importante a las 15:30"</li>
        <li>"${currentLanguage.keywords[1]} Llamar al doctor ${currentLanguage.datePatterns.tomorrow[0]} a las 09:00"</li>
        <li>"${currentLanguage.keywords[2]} Comprar regalos el 12/10 a las 18:00"</li>
        <li>"${currentLanguage.keywords[3]} Cita médica el 15/10/2025 a las 14:30"</li>
      </ul>
    `;
  }
}

