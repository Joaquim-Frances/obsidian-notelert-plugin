import { Plugin, Notice } from "obsidian";
import { NotelertSettings, DetectedPattern } from "./core/types";
import { DEFAULT_SETTINGS } from "./core/settings";
import { NotelertSettingTab } from "./settings/SettingTab";
import { handleEditorChange } from "./features/datetime/handlers";
import { createNotification } from "./features/notifications";
import { getTranslation } from "./i18n";
import { preloadPremiumStatus } from "./features/premium/premium-service";

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

    // Precargar estado premium en segundo plano (no bloquea la carga del plugin)
    void this.preloadPremium();

    console.debug("Plugin Notelert cargado correctamente");
  }

  /**
   * Precarga el estado premium en segundo plano
   */
  private async preloadPremium() {
    try {
      await preloadPremiumStatus(this.settings.pluginToken);
      console.debug("[Notelert] Estado premium precargado");
    } catch (error) {
      console.debug("[Notelert] Error precargando premium:", error);
    }
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
  // Retorna void (antes retornaba boolean, pero se cambió para cumplir con INotelertPlugin)
  public async createNotificationAndMarkProcessed(pattern: DetectedPattern): Promise<void> {
    try {
      // Crear la notificación
      await this.createNotificationInternal(pattern);

      // TEMPORALMENTE COMENTADO - Debug para identificar el problema del guardado continuo
      // // Mostrar notificación de éxito
      // new Notice(getTranslation(this.settings.language, "notices.notificationCreated", { title: pattern.title }));
    } catch (error) {
      this.log(`Error procesando notificación confirmada: ${error}`);
      // TEMPORALMENTE COMENTADO - Debug
      // new Notice(getTranslation(this.settings.language, "notices.errorCreatingNotification", { title: pattern.title }));
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
        "Token no encontrado en el enlace",
        10000
      );
      this.log("Error: token no encontrado en deep link");
      return;
    }

    try {
      // Validar formato del token (debe tener 64 caracteres)
      if (token.length !== 64) {
        new Notice(
          getTranslation(this.settings.language, "notices.tokenInvalidFormat") ||
          "Formato de token inválido",
          10000
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
        "Token vinculado correctamente",
        10000
      );
      this.log("Token vinculado correctamente desde la app móvil");

      // Reiniciar el plugin para que detecte el nuevo token inmediatamente
      // Esperamos un segundo para asegurar que los settings se han guardado y el usuario ve el aviso
      setTimeout(() => {
        try {
          // @ts-ignore
          const plugins = this.app.plugins;
          const pluginId = this.manifest.id;

          this.log(`Reiniciando plugin ${pluginId}...`);

          plugins.disablePlugin(pluginId).then(() => {
            plugins.enablePlugin(pluginId);
          });
        } catch (e) {
          this.log(`Error al reiniciar el plugin: ${e}`);
        }
      }, 1000);

      // Opcional: Abrir la configuración del plugin para que el usuario vea el token
      // this.app.setting.openTabById("notelert");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      new Notice(
        getTranslation(this.settings.language, "notices.tokenLinkError") ||
        `Error al vincular token: ${errorMessage}`,
        10000
      );
      this.log(`Error al vincular token: ${errorMessage}`);
    }
  }
}

export default NotelertPlugin;
