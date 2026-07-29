import { Plugin, Notice } from "obsidian";
import { NotelertSettings, DetectedPattern } from "./core/types";
import { DEFAULT_SETTINGS } from "./core/settings";
import { NotelertSettingTab } from "./settings/SettingTab";
import { handleEditorChange } from "./features/datetime/handlers";
import { createNotification } from "./features/notifications";
import { getTranslation } from "./i18n";
import { invalidatePremiumCache, preloadPremiumStatus } from "./features/premium/premium-service";
import { getNotificationEmailConfiguration } from "./features/notifications/email-verification-api";

export class NotelertPlugin extends Plugin {
  settings: NotelertSettings;

  async onload() {
    console.debug("Cargando plugin Notelert");
    await this.loadSettings();
    await this.ensureInstallationId();

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

    // Alias para compatibilidad con versiones antiguas o errores de la app
    this.registerObsidianProtocolHandler("notelert-token", async (params) => {
      await this.handleTokenLink(params);
    });

    // Precargar estado premium en segundo plano (no bloquea la carga del plugin)
    void this.preloadPremium();
    void this.syncDeliveryConfiguration();

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
    const loadedSettings = (await this.loadData()) as Partial<NotelertSettings> | null;
    this.settings = Object.assign({}, DEFAULT_SETTINGS, loadedSettings ?? {});
    // Migración no disruptiva: los usuarios existentes conservan push como
    // único canal salvo que ya tengan un email verificado, en cuyo caso el
    // comportamiento anterior era programar ambos canales disponibles.
    if (!loadedSettings?.deliveryMode) {
      this.settings.deliveryMode = this.settings.notificationEmailStatus === "verified"
        ? "both"
        : "push";
    }
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  private async ensureInstallationId(): Promise<void> {
    if (this.settings.pluginInstallationId) {
      return;
    }

    const bytes = new Uint8Array(24);
    window.crypto.getRandomValues(bytes);
    this.settings.pluginInstallationId = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
    await this.saveSettings();
  }

  public async syncDeliveryConfiguration(): Promise<void> {
    const token = this.settings.pluginToken?.trim();
    if (!token) {
      return;
    }

    try {
      const configuration = await getNotificationEmailConfiguration(token);
      this.settings.notificationEmail = configuration.notificationEmail || "";
      this.settings.notificationEmailStatus = configuration.status;
      this.settings.hasActivePushDevice = configuration.hasActivePushDevice;
      // Compatibilidad de lectura con versiones anteriores. El servidor sigue
      // siendo la única fuente autorizada del destinatario.
      this.settings.userEmail = configuration.notificationEmail || "";
      await this.saveSettings();
    } catch (error) {
      this.log(`No se pudo sincronizar la configuración de entrega: ${error}`);
    }
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

  private getSafeReturnLink(params: Record<string, string>) {
    const rawReturnLink = params.returnLink || params.returnUrl;
    if (!rawReturnLink) {
      return null;
    }

    let returnLink = rawReturnLink;
    try {
      returnLink = decodeURIComponent(rawReturnLink);
    } catch {
      returnLink = rawReturnLink;
    }

    return returnLink.startsWith("notelert://") ? returnLink : null;
  }

  private openReturnLink(returnLink: string) {
    const openedWindow = window.open(returnLink, "_blank");
    if (!openedWindow) {
      window.location.href = returnLink;
    }
  }

  // Manejar deep link de vinculación con la app móvil
  private async handleTokenLink(params: Record<string, string>) {
    const token = params.token;
    const returnLink = this.getSafeReturnLink(params);

    if (!token) {
      new Notice(getTranslation(this.settings.language, "notices.tokenNotFound"), 10000);
      this.log("Error: token no encontrado en deep link");
      return;
    }

    try {
      // Validar formato del token (debe tener 64 caracteres)
      if (token.length !== 64) {
        new Notice(getTranslation(this.settings.language, "notices.tokenInvalidFormat"), 10000);
        this.log(`Error: token con formato inválido (longitud: ${token.length})`);
        return;
      }

      // Guardar token en settings
      this.settings.pluginToken = token.trim();
      await this.saveSettings();
      invalidatePremiumCache();
      void preloadPremiumStatus(this.settings.pluginToken);
      void this.syncDeliveryConfiguration();

      // Mostrar notificación de éxito
      new Notice(getTranslation(this.settings.language, "notices.tokenLinked"), 10000);
      this.log("Token vinculado correctamente desde la app móvil");

      if (returnLink) {
        window.setTimeout(() => {
          try {
            this.openReturnLink(returnLink);
          } catch (error) {
            this.log(`Error volviendo a la app móvil: ${error}`);
          }
        }, 500);
      }

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
