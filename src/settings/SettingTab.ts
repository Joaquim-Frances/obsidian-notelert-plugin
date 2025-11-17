import { App, Plugin, PluginSettingTab, Setting, Modal, Platform, Notice } from "obsidian";
import { INotelertPlugin } from "../core/plugin-interface";
import { SUPPORTED_LANGUAGES, getTranslation, getLanguageByCode, getDefaultLanguage } from "../i18n";
import { SavedLocation, ScheduledEmail } from "../core/types";
import { searchLocations, GeocodingResult } from "../features/location/geocode";
import { cancelScheduledEmail } from "../features/notifications/firebase-api";
import { NotelertLocationPickerModal } from "../modals/LocationPickerModal";
import { DEFAULT_NOTELERT_API_KEY } from "../core/config";

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

    containerEl.createEl("h2", { text: getTranslation(this.plugin.settings.language, "settings.title") });

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
      platformInfo.createEl("h4", { 
        text: "💻 Modo Desktop",
        attr: { style: "margin: 0 0 8px 0; font-size: 16px; font-weight: 600;" }
      });
      platformInfo.createEl("p", {
        text: "En desktop, Notelert envía notificaciones por email. Las notificaciones de ubicación solo están disponibles en móvil.",
        attr: { style: "margin: 0; color: var(--text-muted); font-size: 13px; line-height: 1.5;" }
      });
    } else {
      platformInfo.createEl("h4", { 
        text: "📱 Modo Móvil",
        attr: { style: "margin: 0 0 8px 0; font-size: 16px; font-weight: 600;" }
      });
      platformInfo.createEl("p", {
        text: "En móvil, Notelert usa la app para enviar notificaciones push y emails. Puedes configurar ubicaciones favoritas para recordatorios basados en ubicación.",
        attr: { style: "margin: 0; color: var(--text-muted); font-size: 13px; line-height: 1.5;" }
      });
    }

    // ========== CONFIGURACIÓN BÁSICA ==========
    containerEl.createEl("h3", { text: "Configuración Básica" });

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
          this.display(); // Recargar para actualizar traducciones
        });
      });

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

    // ========== CONFIGURACIÓN DESKTOP ==========
    if (isDesktop) {
      containerEl.createEl("h3", { text: "💻 Configuración Desktop" });

      // Email del usuario
      new Setting(containerEl)
        .setName("Email del Usuario")
        .setDesc("Email donde recibirás las notificaciones programadas")
        .addText((text) => {
          text
            .setPlaceholder("usuario@email.com")
            .setValue(this.plugin.settings.userEmail || "")
            .onChange(async (value) => {
              this.plugin.settings.userEmail = value;
              await this.plugin.saveSettings();
            });
        });

      // API Key de Notelert (opcional - ya viene configurada por defecto)
      new Setting(containerEl)
        .setName("API Key de Notelert (Opcional)")
        .setDesc("API Key para autenticación. Ya viene configurada por defecto, solo cambia esto si es necesario.")
        .addText((text) => {
          text
            .setPlaceholder(DEFAULT_NOTELERT_API_KEY ? "API Key configurada" : "Introduce tu API Key")
            .setValue(this.plugin.settings.notelertApiKey || "")
            .inputEl.type = "password"; // Ocultar la API key
          text.onChange(async (value) => {
            this.plugin.settings.notelertApiKey = value;
            await this.plugin.saveSettings();
          });
        });

      // Lista de emails programados
      containerEl.createEl("h4", { text: "📧 Emails Programados" });
      
      const emailsDesc = containerEl.createEl("p", {
        text: "Gestiona tus emails programados. Puedes cancelarlos antes de que se envíen.",
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

    // ========== CONFIGURACIÓN MÓVIL ==========
    if (!isDesktop) {
      containerEl.createEl("h3", { text: "📱 Configuración Móvil" });

      // Gestión de ubicaciones
      containerEl.createEl("h4", { text: "📍 Ubicaciones Guardadas" });
      
      const locationsDesc = containerEl.createEl("p", {
        text: "Gestiona tus ubicaciones favoritas. Estas aparecerán cuando selecciones 'Ubicación' al crear una notificación.",
        attr: { style: "color: var(--text-muted); font-size: 13px; margin-bottom: 15px;" }
      });

      // Botón para añadir nueva ubicación
      new Setting(containerEl)
        .setName("Añadir Nueva Ubicación")
        .setDesc("Abre el selector de ubicaciones con mapa para añadir una nueva ubicación")
        .addButton((button) => {
          button
            .setButtonText("➕ Añadir Ubicación")
            .setCta()
            .onClick(() => {
              this.openLocationPicker();
            });
        });

      // Lista de ubicaciones guardadas
      const locationsContainer = containerEl.createEl("div", {
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

      this.renderSavedLocations(locationsContainer);
    }
  }

  // Renderizar lista de ubicaciones guardadas
  private renderSavedLocations(container: HTMLElement) {
    // Limpiar completamente el contenedor
    container.empty();
    
    // Obtener ubicaciones actualizadas de settings
    const locations = this.plugin.settings.savedLocations || [];

    if (locations.length === 0) {
      container.createEl("p", {
        text: "No hay ubicaciones guardadas. Haz clic en 'Añadir Ubicación' para empezar.",
        attr: { style: "color: var(--text-muted); text-align: center; padding: 20px;" }
      });
      return;
    }

    // Crear lista de ubicaciones
    locations.forEach((location, index) => {
      const locationItem = container.createEl("div", {
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

      const locationInfo = locationItem.createEl("div", {
        attr: { style: "flex: 1; min-width: 200px;" }
      });

      locationInfo.createEl("div", {
        text: location.name,
        attr: { style: "font-weight: 500; margin-bottom: 4px; font-size: 14px;" }
      });

      if (location.address) {
        locationInfo.createEl("div", {
          text: location.address.length > 60 ? location.address.substring(0, 60) + "..." : location.address,
          attr: { style: "font-size: 12px; color: var(--text-muted); margin-bottom: 4px; word-wrap: break-word;" }
        });
      }

      locationInfo.createEl("div", {
        text: `📍 ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`,
        attr: { style: "font-size: 11px; color: var(--text-muted);" }
      });

      const buttonsContainer = locationItem.createEl("div", {
        attr: { style: "display: flex; gap: 6px; flex-shrink: 0;" }
      });

      const editButton = buttonsContainer.createEl("button", {
        text: "✏️ Editar",
        attr: { style: "padding: 6px 12px; font-size: 12px; white-space: nowrap;" }
      });
      editButton.addEventListener("click", () => {
        this.editLocation(location, index);
      });

      const deleteButton = buttonsContainer.createEl("button", {
        text: "🗑️",
        attr: { style: "padding: 6px 10px; font-size: 14px; color: var(--text-error);" }
      });
      deleteButton.addEventListener("click", async () => {
        await this.deleteLocation(index);
        // Recargar toda la configuración para actualizar la lista
        this.display();
      });
    });
  }

  // Renderizar lista de emails programados
  private renderScheduledEmails(container: HTMLElement) {
    container.empty();
    
    const emails = this.plugin.settings.scheduledEmails || [];

    if (emails.length === 0) {
      container.createEl("p", {
        text: "No hay emails programados. Los emails que programes aparecerán aquí.",
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
        })} ${isPast ? '(Pasado)' : ''}`,
        attr: { 
          style: `font-size: 11px; color: ${isPast ? 'var(--text-error)' : 'var(--text-muted)'};` 
        }
      });

      const buttonsContainer = emailItem.createEl("div", {
        attr: { style: "display: flex; gap: 6px; flex-shrink: 0;" }
      });

      const cancelButton = buttonsContainer.createEl("button", {
        text: "🗑️ Cancelar",
        attr: { 
          style: "padding: 6px 12px; font-size: 12px; white-space: nowrap; color: var(--text-error);" 
        }
      });
      cancelButton.addEventListener("click", async () => {
        // Encontrar el índice real en la lista original
        const realIndex = emails.findIndex(e => e.notificationId === email.notificationId);
        await this.cancelScheduledEmail(email, realIndex);
      });
    });
  }

  // Cancelar email programado
  private async cancelScheduledEmail(email: ScheduledEmail, index: number) {
    // Usar API key de settings o la por defecto
    const apiKey = this.plugin.settings.notelertApiKey || DEFAULT_NOTELERT_API_KEY;
    
    if (!apiKey) {
      new Notice("❌ API Key no configurada. Contacta al desarrollador del plugin.");
      return;
    }

    const result = await cancelScheduledEmail(
      email.notificationId,
      apiKey
    );

    if (result.success) {
      // Eliminar de la lista local
      this.plugin.settings.scheduledEmails.splice(index, 1);
      await this.plugin.saveSettings();
      this.display(); // Recargar para actualizar la lista
      new Notice("✅ Email cancelado correctamente");
    } else {
      new Notice(`❌ Error: ${result.error || 'Error al cancelar email'}`);
    }
  }

  // Abrir selector de ubicaciones
  private openLocationPicker() {
    const modal = new NotelertLocationPickerModal(
      this.app,
      this.plugin,
      this.plugin.settings.language,
      async (location) => {
        // Callback cuando se guarda una ubicación
        if (!this.plugin.settings.savedLocations) {
          this.plugin.settings.savedLocations = [];
        }
        this.plugin.settings.savedLocations.push(location);
        await this.plugin.saveSettings();
        this.display(); // Recargar para mostrar la nueva ubicación
      }
    );
    modal.open();
  }

  // Editar ubicación
  private editLocation(location: SavedLocation, index: number) {
    const modal = new NotelertLocationPickerModal(
      this.app,
      this.plugin,
      this.plugin.settings.language,
      async (newLocation) => {
        // Reemplazar la ubicación existente
        this.plugin.settings.savedLocations[index] = newLocation;
        await this.plugin.saveSettings();
        this.display();
      },
      location // Pasar ubicación existente para editar
    );
    modal.open();
  }

  // Eliminar ubicación
  private async deleteLocation(index: number) {
    this.plugin.settings.savedLocations.splice(index, 1);
    await this.plugin.saveSettings();
  }
}
