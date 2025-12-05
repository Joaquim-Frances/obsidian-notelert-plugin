import { Plugin, Notice } from "obsidian";
import { NotelertSettings, DetectedPattern } from "./core/types";
import { DEFAULT_SETTINGS } from "./core/settings";
import { NotelertSettingTab } from "./settings/SettingTab";
import { handleEditorChange } from "./features/datetime/handlers";
import { createNotification, generateDeepLink } from "./features/notifications";
import { getTranslation } from "./i18n";

export class NotelertPlugin extends Plugin {
  settings: NotelertSettings;

  async onload() {
    console.debug("Cargando plugin Notelert");
    await this.loadSettings();

    // Configuración del plugin
    this.addSettingTab(new NotelertSettingTab(this.app, this));

    // Barra de estado
    this.addStatusBarItem().setText("Notelert: activo");

    // Evento para detectar :@ y :# y abrir modales
    if (this.settings.enableDatePicker) {
      this.registerEvent(
        this.app.workspace.on("editor-change", (editor, info) => {
          handleEditorChange(editor, info, this);
        })
      );
    }

    // Registrar handler para deep links de vinculación con la app móvil
    this.registerObsidianProtocolHandler("notelert-link", async (params) => {
      await this.handleTokenLink(params);
    });

    console.debug("Plugin Notelert cargado correctamente");
  }

  onunload() {
    console.debug("Descargando plugin Notelert");
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
      (email) => {
        void (async () => {
          if (!this.settings.scheduledEmails) {
            this.settings.scheduledEmails = [];
          }
          this.settings.scheduledEmails.push(email);
          await this.saveSettings();
        })();
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
      console.debug(`[Notelert] ${message}`);
    }
  }

  // Manejar deep link de vinculación con la app móvil
  private async handleTokenLink(params: Record<string, string>) {
    const token = params.token;
    
    if (!token) {
      new Notice(
        getTranslation(this.settings.language, "notices.tokenLinkError") || 
        "Token no encontrado en el enlace"
      );
      this.log("Error: token no encontrado en deep link");
      return;
    }

    try {
      // Validar formato del token (debe tener 64 caracteres)
      if (token.length !== 64) {
        new Notice(
          getTranslation(this.settings.language, "notices.tokenInvalidFormat") || 
          "Formato de token inválido"
        );
        this.log(`Error: token con formato inválido (longitud: ${token.length})`);
        return;
      }

      // Guardar token en settings
      this.settings.pluginToken = token.trim();
      await this.saveSettings();

      // Mostrar notificación de éxito
      new Notice(
        getTranslation(this.settings.language, "notices.tokenLinked") || 
        "Token vinculado correctamente"
      );
      this.log("Token vinculado correctamente desde la app móvil");

      // Opcional: Abrir la configuración del plugin para que el usuario vea el token
      // this.app.setting.openTabById("notelert");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      new Notice(
        getTranslation(this.settings.language, "notices.tokenLinkError") || 
        `Error al vincular token: ${errorMessage}`
      );
      this.log(`Error al vincular token: ${errorMessage}`);
    }
  }
}

export default NotelertPlugin;
