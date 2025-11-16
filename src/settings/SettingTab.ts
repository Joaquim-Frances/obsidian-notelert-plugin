import { App, Plugin, PluginSettingTab, Setting, Modal } from "obsidian";
import { INotelertPlugin } from "../core/plugin-interface";
import { SUPPORTED_LANGUAGES, getTranslation, getLanguageByCode, getDefaultLanguage } from "../i18n";
import { SavedLocation } from "../core/types";
import { searchLocations, GeocodingResult } from "../features/location/geocode";

export class NotelertSettingTab extends PluginSettingTab {
  plugin: INotelertPlugin;

  constructor(app: App, plugin: Plugin & INotelertPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: getTranslation(this.plugin.settings.language, "settings.title") });

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

    // ========== GESTIÓN DE UBICACIONES ==========
    containerEl.createEl("h3", { text: "📍 Ubicaciones Guardadas" });
    
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

  // Abrir selector de ubicaciones
  private openLocationPicker() {
    const modal = new LocationPickerModal(
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
    const modal = new LocationPickerModal(
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

// Modal simplificado para seleccionar/guardar ubicaciones (solo para settings)
class LocationPickerModal extends Modal {
  private plugin: INotelertPlugin;
  private language: string;
  private onSave: (location: SavedLocation) => void;
  private existingLocation?: SavedLocation;
  private selectedLocation: { name: string; latitude: number; longitude: number; radius: number; address?: string } | null = null;
  private searchTimeout: number | null = null;
  private map: any = null;
  private mapMarker: any = null;
  private mapLoaded: boolean = false;

  constructor(
    app: App,
    plugin: INotelertPlugin,
    language: string,
    onSave: (location: SavedLocation) => void,
    existingLocation?: SavedLocation
  ) {
    super(app);
    this.plugin = plugin;
    this.language = language;
    this.onSave = onSave;
    this.existingLocation = existingLocation;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    
    contentEl.setAttribute("style", `
      min-width: 300px; 
      max-width: 600px; 
      width: 95vw;
      max-height: 90vh; 
      overflow: hidden;
      padding: 15px;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
    `);

    const scrollContainer = contentEl.createEl("div", {
      attr: {
        style: `
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding-right: 5px;
          margin-bottom: 10px;
        `
      }
    });

    const title = scrollContainer.createEl("h2", {
      text: this.existingLocation ? "Editar Ubicación" : "Añadir Nueva Ubicación",
      attr: { style: "margin: 0 0 15px 0; font-size: 20px; font-weight: 600;" }
    });

    const instruction = scrollContainer.createEl("p", {
      text: "Busca una dirección o haz clic en el mapa para seleccionar una ubicación",
      attr: { style: "color: var(--text-muted); font-size: 13px; margin-bottom: 15px; font-style: italic;" }
    });

    // Input de búsqueda
    const searchContainer = scrollContainer.createEl("div", {
      attr: { style: "margin-bottom: 15px; position: relative; z-index: 1000;" }
    });

    const searchInput = searchContainer.createEl("input", {
      type: "text",
      placeholder: "Buscar dirección...",
    });
    searchInput.setAttribute("style", `
      width: 100%; 
      padding: 12px; 
      border: 1px solid var(--background-modifier-border); 
      border-radius: 6px;
      font-size: 14px;
      box-sizing: border-box;
    `);

    const resultsContainer = searchContainer.createEl("div", {
      attr: {
        style: `
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          right: 0;
          max-height: 200px; 
          overflow-y: auto; 
          border: 1px solid var(--background-modifier-border); 
          border-radius: 6px; 
          display: none;
          background: var(--background-primary);
          z-index: 1001;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        `
      }
    });
    resultsContainer.id = "location-results-container";

    // Mapa - más compacto para móvil
    const mapContainer = scrollContainer.createEl("div", {
      attr: {
        style: `
          width: 100%;
          height: 200px;
          min-height: 200px;
          max-height: 250px;
          margin: 15px 0;
          border: 1px solid var(--background-modifier-border);
          border-radius: 6px;
          overflow: hidden;
          background: var(--background-secondary);
          position: relative;
        `
      }
    });
    mapContainer.id = "notelert-map-container";

    const mapLoading = mapContainer.createEl("div", {
      text: "Cargando mapa...",
      attr: {
        style: `
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: var(--text-muted);
          z-index: 1;
        `
      }
    });
    mapLoading.id = "map-loading";

    // Contenedor de ubicación seleccionada
    const selectedContainer = scrollContainer.createEl("div", {
      attr: {
        style: `
          margin: 15px 0; 
          padding: 15px; 
          background: var(--background-secondary); 
          border-radius: 6px; 
          display: none; 
          word-wrap: break-word;
          border: 2px solid var(--interactive-accent);
        `
      }
    });
    selectedContainer.id = "location-selected-container";

    // Input de nombre
    const nameContainer = scrollContainer.createEl("div", {
      attr: { style: "margin-bottom: 12px;" }
    });
    nameContainer.createEl("label", {
      text: "Nombre de la ubicación:",
      attr: { style: "display: block; margin-bottom: 5px; font-weight: 500; font-size: 14px;" }
    });
    const nameInput = nameContainer.createEl("input", {
      type: "text",
      placeholder: "Ej: Casa, Trabajo, Supermercado...",
      value: this.existingLocation?.name || ""
    });
    nameInput.setAttribute("style", `
      width: 100%; 
      padding: 10px; 
      border: 1px solid var(--background-modifier-border); 
      border-radius: 6px;
      font-size: 14px;
      box-sizing: border-box;
    `);

    // Botones
    const buttonContainer = contentEl.createEl("div", {
      attr: {
        style: `
          display: flex; 
          gap: 10px; 
          justify-content: flex-end; 
          margin-top: 10px; 
          flex-wrap: wrap;
          flex-shrink: 0;
          padding-top: 10px;
          border-top: 1px solid var(--background-modifier-border);
        `
      }
    });

    const cancelButton = buttonContainer.createEl("button", {
      text: "Cancelar",
      cls: "mod-secondary"
    });
    cancelButton.setAttribute("style", "flex: 1; min-width: 100px; padding: 10px 20px;");
    cancelButton.addEventListener("click", () => this.close());

    const saveButton = buttonContainer.createEl("button", {
      text: this.existingLocation ? "Guardar Cambios" : "Guardar Ubicación",
      cls: "mod-cta"
    });
    saveButton.id = "save-location-button";
    saveButton.setAttribute("disabled", "true");
    saveButton.setAttribute("style", `
      flex: 1; 
      min-width: 100px; 
      padding: 10px 20px;
      opacity: 0.5;
      cursor: not-allowed;
    `);
    saveButton.addEventListener("click", async () => {
      if (this.selectedLocation && nameInput.value.trim()) {
        const location: SavedLocation = {
          name: nameInput.value.trim(),
          latitude: this.selectedLocation.latitude,
          longitude: this.selectedLocation.longitude,
          radius: 100, // Radio estándar fijo
          address: this.selectedLocation.address
        };
        this.onSave(location);
        this.close();
      }
    });

    // Listener de búsqueda
    searchInput.addEventListener("input", (e) => {
      const query = (e.target as HTMLInputElement).value.trim();
      
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout);
      }

      if (query.length < 3) {
        resultsContainer.style.display = "none";
        return;
      }

      this.searchTimeout = window.setTimeout(() => {
        this.searchLocations(query, resultsContainer);
      }, 500);
    });

    // Si hay ubicación existente, seleccionarla
    if (this.existingLocation) {
      this.selectLocation({
        name: this.existingLocation.name,
        latitude: this.existingLocation.latitude,
        longitude: this.existingLocation.longitude,
        radius: this.existingLocation.radius,
        address: this.existingLocation.address
      });
      nameInput.value = this.existingLocation.name;
      radiusInput.value = String(this.existingLocation.radius);
    }

    // Cargar mapa
    this.loadGoogleMap();
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    if (this.mapMarker) {
      this.mapMarker.setMap(null);
      this.mapMarker = null;
    }
    this.map = null;
    this.mapLoaded = false;
  }

  private async searchLocations(query: string, resultsContainer: HTMLElement) {
    try {
      resultsContainer.style.display = "block";
      resultsContainer.innerHTML = `<div style='padding: 20px; text-align: center; color: var(--text-muted);'>Buscando...</div>`;

      const results = await searchLocations(
        query,
        this.plugin.settings,
        this.language || 'es',
        (msg) => this.plugin.log(msg)
      );

      if (results.length === 0) {
        resultsContainer.innerHTML = `<div style='padding: 20px; text-align: center; color: var(--text-muted);'>No se encontraron resultados</div>`;
        return;
      }

      resultsContainer.innerHTML = "";
      results.forEach((result: GeocodingResult) => {
        const resultItem = resultsContainer.createEl("div", {
          attr: {
            style: `
              padding: 12px;
              margin: 5px 0;
              border: 1px solid var(--background-modifier-border);
              border-radius: 4px;
              cursor: pointer;
              transition: background 0.2s;
            `
          }
        });

        resultItem.addEventListener("mouseenter", () => {
          resultItem.style.background = "var(--background-modifier-hover)";
        });
        resultItem.addEventListener("mouseleave", () => {
          resultItem.style.background = "";
        });

        resultItem.createEl("div", {
          text: result.name,
          attr: { style: "font-weight: 500; margin-bottom: 4px;" }
        });
        resultItem.createEl("div", {
          text: result.displayName.length > 80 ? result.displayName.substring(0, 80) + "..." : result.displayName,
          attr: { style: "font-size: 11px; color: var(--text-muted);" }
        });

        resultItem.addEventListener("click", () => {
          this.selectLocation({
            name: result.name,
            latitude: result.latitude,
            longitude: result.longitude,
            radius: 100, // Radio estándar
            address: result.displayName
          });
          if (this.map) {
            this.updateMapMarker(result.latitude, result.longitude);
          }
        });
      });
    } catch (error: any) {
      resultsContainer.innerHTML = `<div style='padding: 20px; text-align: center; color: var(--text-error);'>Error: ${error?.message || 'Error desconocido'}</div>`;
    }
  }

  private selectLocation(location: { name: string; latitude: number; longitude: number; radius: number; address?: string }) {
    this.selectedLocation = location;
    
    const selectedContainer = document.getElementById("location-selected-container");
    const saveButton = document.getElementById("save-location-button") as HTMLButtonElement;
    const resultsContainer = document.getElementById("location-results-container");
    
    if (selectedContainer && saveButton) {
      selectedContainer.style.display = "block";
      selectedContainer.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
          <span style="font-size: 18px;">📍</span>
          <strong>${location.name}</strong>
        </div>
        <small style="color: var(--text-muted); display: block; margin-bottom: 4px;">${location.address || ''}</small>
        <small style="color: var(--text-muted); font-size: 10px;">Lat: ${location.latitude.toFixed(6)}, Lon: ${location.longitude.toFixed(6)}</small>
      `;
      saveButton.removeAttribute("disabled");
      saveButton.style.opacity = "1";
      saveButton.style.cursor = "pointer";
    }

    if (resultsContainer) {
      resultsContainer.style.display = "none";
    }

    if (this.map) {
      this.updateMapMarker(location.latitude, location.longitude);
    }
  }

  private loadGoogleMap() {
    if ((window as any).google && (window as any).google.maps) {
      this.mapLoaded = true;
      setTimeout(() => this.initMap(), 100);
      return;
    }

    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      const checkInterval = setInterval(() => {
        if ((window as any).google && (window as any).google.maps) {
          clearInterval(checkInterval);
          this.mapLoaded = true;
          setTimeout(() => this.initMap(), 100);
        }
      }, 100);
      return;
    }

    const callbackName = `initNotelertMap_${Date.now()}`;
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBwR-GmihN8Xic-npwi6p4wTUwJ67ueWvk&libraries=places&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    
    (window as any)[callbackName] = () => {
      this.mapLoaded = true;
      delete (window as any)[callbackName];
      setTimeout(() => this.initMap(), 100);
    };

    document.head.appendChild(script);
  }

  private initMap() {
    try {
      const mapContainer = document.getElementById('notelert-map-container');
      if (!mapContainer) return;

      if (!(window as any).google || !(window as any).google.maps) return;

      const loading = document.getElementById('map-loading');
      if (loading) loading.style.display = 'none';

      const defaultCenter = this.existingLocation
        ? { lat: this.existingLocation.latitude, lng: this.existingLocation.longitude }
        : { lat: 40.4168, lng: -3.7038 };

      this.map = new (window as any).google.maps.Map(mapContainer, {
        center: defaultCenter,
        zoom: 13,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: false,
        gestureHandling: 'cooperative'
      });

      this.map.addListener('click', (e: any) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        this.reverseGeocode(lat, lng);
      });

      if (this.existingLocation) {
        this.updateMapMarker(this.existingLocation.latitude, this.existingLocation.longitude);
      }
    } catch (error) {
      this.plugin.log(`Error inicializando mapa: ${error}`);
    }
  }

  private async reverseGeocode(lat: number, lng: number) {
    try {
      const geocoder = new (window as any).google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results: any[], status: string) => {
        if (status === 'OK' && results[0]) {
          const result = results[0];
          const address = result.formatted_address;
          const shortName = result.address_components[0]?.long_name || 
                           result.address_components[1]?.long_name || 
                           'Ubicación seleccionada';
          
          this.selectLocation({
            name: shortName,
            latitude: lat,
            longitude: lng,
            radius: 100, // Radio estándar
            address: address
          });
          this.updateMapMarker(lat, lng);
        }
      });
    } catch (error) {
      this.plugin.log(`Error en geocodificación inversa: ${error}`);
    }
  }

  private updateMapMarker(lat: number, lng: number) {
    if (!this.map) return;

    if (this.mapMarker) {
      this.mapMarker.setMap(null);
    }

    this.mapMarker = new (window as any).google.maps.Marker({
      position: { lat, lng },
      map: this.map,
      draggable: true,
      animation: (window as any).google.maps.Animation.DROP
    });

    this.mapMarker.addListener('dragend', (e: any) => {
      const newLat = e.latLng.lat();
      const newLng = e.latLng.lng();
      this.reverseGeocode(newLat, newLng);
    });

    this.map.setCenter({ lat, lng });
  }
}
