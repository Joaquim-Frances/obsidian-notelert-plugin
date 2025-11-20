import { Plugin } from "obsidian";
import { NotelertSettings, DetectedPattern } from "./core/types";
import { DEFAULT_SETTINGS } from "./core/settings";
import { NotelertSettingTab } from "./settings/SettingTab";
import { handleEditorChange } from "./features/datetime/handlers";
import { createNotification, generateDeepLink } from "./features/notifications";

export class NotelertPlugin extends Plugin {
  settings: NotelertSettings;

  async onload() {
    console.log("Cargando plugin Notelert...");
    await this.loadSettings();

    // Configuración del plugin
    this.addSettingTab(new NotelertSettingTab(this.app, this));

    // Barra de estado
    this.addStatusBarItem().setText("Notelert: Activo");

    // Evento para detectar :@ y :# y abrir modales
    if (this.settings.enableDatePicker) {
      this.registerEvent(
        this.app.workspace.on("editor-change", (editor, info) => {
          handleEditorChange(editor, info, this);
        })
      );
    }

    console.log("Plugin Notelert cargado correctamente");
  }

  onunload() {
    console.log("Descargando plugin Notelert...");
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  // Crear la notificación (función separada para reutilizar)
  private async createNotificationInternal(pattern: DetectedPattern) {
    await createNotification(
      pattern, 
      this.app, 
      this.settings, 
      (msg) => this.log(msg),
      // Callback para guardar email programado (solo desktop)
      async (email) => {
        if (!this.settings.scheduledEmails) {
          this.settings.scheduledEmails = [];
        }
        this.settings.scheduledEmails.push(email);
        await this.saveSettings();
      }
    );
  }

  // Crear notificación y marcarla como procesada (para uso con modal)
  // Retorna true si fue exitoso, false si hubo error
  public async createNotificationAndMarkProcessed(pattern: DetectedPattern): Promise<boolean> {
    try {
      // Crear la notificación
      await this.createNotificationInternal(pattern);
      
      // TEMPORALMENTE COMENTADO - Debug para identificar el problema del guardado continuo
      // // Mostrar notificación de éxito
      // new Notice(getTranslation(this.settings.language, "notices.notificationCreated", { title: pattern.title }));
      return true;
    } catch (error) {
      this.log(`Error procesando notificación confirmada: ${error}`);
      // TEMPORALMENTE COMENTADO - Debug
      // new Notice(getTranslation(this.settings.language, "notices.errorCreatingNotification", { title: pattern.title }));
      return false;
    }
  }

  // Función de logging
  public log(message: string) {
    if (this.settings.debugMode) {
      console.log(`[Notelert] ${message}`);
    }
  }
}

export default NotelertPlugin;
