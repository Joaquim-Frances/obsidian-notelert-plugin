import { App, Modal, Notice } from "obsidian";
import { DetectedPattern, SavedLocation } from "../core/types";
import { getTranslation } from "../i18n";
import { INotelertPlugin } from "../core/plugin-interface";

export class NotelertLocationPickerModal extends Modal {
  private plugin: INotelertPlugin;
  private language: string;
  private editor: any;
  private cursor: any;
  private originalText: string;
  private onCancel: () => void;
  private selectedLocation: { name: string; latitude: number; longitude: number; radius: number; address?: string } | null = null;
  private searchTimeout: number | null = null;
  private searchResults: any[] = [];

  constructor(
    app: App,
    plugin: INotelertPlugin,
    language: string,
    editor: any,
    cursor: any,
    originalText: string,
    onCancel: () => void
  ) {
    super(app);
    this.plugin = plugin;
    this.language = language;
    this.editor = editor;
    this.cursor = cursor;
    this.originalText = originalText;
    this.onCancel = onCancel;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.setAttribute("style", "min-width: 500px;");

    contentEl.createEl("h2", { text: getTranslation(this.language, "locationPicker.title") || "Seleccionar Ubicación" });

    // Input para buscar dirección
    const searchContainer = contentEl.createEl("div", { cls: "notelert-location-search" });
    searchContainer.setAttribute("style", "margin: 20px 0;");
    
    const searchInput = searchContainer.createEl("input", {
      type: "text",
      placeholder: getTranslation(this.language, "locationPicker.searchPlaceholder") || "Buscar dirección...",
      cls: "notelert-location-input"
    });
    searchInput.setAttribute("style", "width: 100%; padding: 10px; border: 1px solid var(--background-modifier-border); border-radius: 4px;");

    // Contenedor para resultados de búsqueda
    const resultsContainer = contentEl.createEl("div", { cls: "notelert-location-results" });
    resultsContainer.setAttribute("style", "max-height: 300px; overflow-y: auto; margin: 15px 0; border: 1px solid var(--background-modifier-border); border-radius: 4px; display: none;");
    resultsContainer.id = "location-results-container";

    // Contenedor para ubicación seleccionada
    const selectedContainer = contentEl.createEl("div", { cls: "notelert-location-selected" });
    selectedContainer.setAttribute("style", "margin: 15px 0; padding: 15px; background: var(--background-secondary); border-radius: 4px; display: none;");
    selectedContainer.id = "location-selected-container";

    // Input para radio de geofence
    const radiusContainer = contentEl.createEl("div", { cls: "notelert-location-radius" });
    radiusContainer.setAttribute("style", "margin: 15px 0; display: flex; align-items: center; gap: 10px;");
    
    radiusContainer.createEl("label", { 
      text: getTranslation(this.language, "locationPicker.radius") || "Radio (metros):",
      attr: { style: "font-size: 14px;" }
    });
    
    const radiusInput = radiusContainer.createEl("input", {
      type: "number",
      value: "100"
    });
    radiusInput.setAttribute("min", "50");
    radiusInput.setAttribute("max", "1000");
    radiusInput.setAttribute("step", "50");
    radiusInput.setAttribute("style", "width: 100px; padding: 6px; border: 1px solid var(--background-modifier-border); border-radius: 4px;");

    // Sección de favoritas
    const favoritesSection = contentEl.createEl("div", { cls: "notelert-location-favorites" });
    favoritesSection.setAttribute("style", "margin: 20px 0;");
    
    favoritesSection.createEl("h3", { 
      text: getTranslation(this.language, "locationPicker.favorites") || "Ubicaciones Favoritas",
      attr: { style: "font-size: 16px; font-weight: 500; margin-bottom: 10px;" }
    });

    const favoritesList = favoritesSection.createEl("div", { cls: "notelert-location-favorites-list" });
    favoritesList.setAttribute("style", "max-height: 200px; overflow-y: auto;");

    this.renderFavorites(favoritesList);

    // Botones principales
    const buttonContainer = contentEl.createEl("div", { cls: "notelert-locationpicker-buttons" });
    buttonContainer.setAttribute("style", "display: flex; gap: 12px; justify-content: flex-end; margin-top: 20px;");
    
    const cancelButton = buttonContainer.createEl("button", { 
      text: getTranslation(this.language, "locationPicker.cancelButton") || "Cancelar",
      cls: "mod-secondary"
    });
    cancelButton.addEventListener("click", () => {
      this.onCancel();
      this.close();
    });

    const confirmButton = buttonContainer.createEl("button", { 
      text: getTranslation(this.language, "locationPicker.confirmButton") || "Confirmar",
      cls: "mod-cta"
    });
    confirmButton.id = "confirm-location-button";
    confirmButton.setAttribute("disabled", "true");
    confirmButton.addEventListener("click", () => {
      if (this.selectedLocation) {
        this.createNotificationFromLocation(
          this.selectedLocation.name,
          this.selectedLocation.latitude,
          this.selectedLocation.longitude,
          parseInt(radiusInput.value) || 100
        );
        this.close();
      }
    });

    // Listener para búsqueda con debounce
    searchInput.addEventListener("input", (e) => {
      const query = (e.target as HTMLInputElement).value.trim();
      
      // Limpiar timeout anterior
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout);
      }

      if (query.length < 3) {
        resultsContainer.style.display = "none";
        return;
      }

      // Debounce: esperar 500ms después de que el usuario deje de escribir
      this.searchTimeout = window.setTimeout(() => {
        this.searchLocations(query, resultsContainer);
      }, 500);
    });
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  }

  // Buscar ubicaciones usando Nominatim (OpenStreetMap)
  private async searchLocations(query: string, resultsContainer: HTMLElement) {
    try {
      resultsContainer.style.display = "block";
      resultsContainer.innerHTML = "<div style='padding: 20px; text-align: center; color: var(--text-muted);'>Buscando...</div>";

      // Usar Nominatim API de OpenStreetMap (gratuita, no requiere API key)
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Notelert-Obsidian-Plugin' // Nominatim requiere User-Agent
        }
      });

      if (!response.ok) {
        throw new Error('Error en la búsqueda');
      }

      const data = await response.json();
      this.searchResults = data;

      if (data.length === 0) {
        resultsContainer.innerHTML = "<div style='padding: 20px; text-align: center; color: var(--text-muted);'>No se encontraron resultados</div>";
        return;
      }

      // Mostrar resultados
      resultsContainer.innerHTML = "";
      data.forEach((result: any) => {
        const resultItem = resultsContainer.createEl("div", { cls: "notelert-location-result-item" });
        resultItem.setAttribute("style", "padding: 12px; margin: 5px 0; border: 1px solid var(--background-modifier-border); border-radius: 4px; cursor: pointer; transition: background 0.2s;");
        
        resultItem.addEventListener("mouseenter", () => {
          resultItem.style.background = "var(--background-modifier-hover)";
        });
        resultItem.addEventListener("mouseleave", () => {
          resultItem.style.background = "";
        });

        const displayName = result.display_name || result.name || "Ubicación sin nombre";
        const address = result.address || {};
        const shortName = address.road || address.city || address.town || address.village || displayName.split(',')[0];

        resultItem.createEl("div", { 
          text: shortName,
          attr: { style: "font-weight: 500; margin-bottom: 4px;" }
        });
        resultItem.createEl("div", { 
          text: displayName.length > 80 ? displayName.substring(0, 80) + "..." : displayName,
          attr: { style: "font-size: 11px; color: var(--text-muted);" }
        });

        resultItem.addEventListener("click", () => {
          this.selectLocation({
            name: shortName,
            latitude: parseFloat(result.lat),
            longitude: parseFloat(result.lon),
            radius: 100,
            address: displayName
          });
        });
      });
    } catch (error) {
      this.plugin.log(`Error buscando ubicaciones: ${error}`);
      resultsContainer.innerHTML = "<div style='padding: 20px; text-align: center; color: var(--text-error);'>Error al buscar ubicaciones</div>";
    }
  }

  // Seleccionar una ubicación
  private selectLocation(location: { name: string; latitude: number; longitude: number; radius: number; address?: string }) {
    this.selectedLocation = location;
    
    const selectedContainer = document.getElementById("location-selected-container");
    const confirmButton = document.getElementById("confirm-location-button") as HTMLButtonElement;
    const resultsContainer = document.getElementById("location-results-container");
    
    if (selectedContainer && confirmButton) {
      selectedContainer.style.display = "block";
      selectedContainer.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: start;">
          <div>
            <strong>${location.name}</strong><br>
            <small style="color: var(--text-muted);">${location.address || ''}</small><br>
            <small style="color: var(--text-muted); font-size: 10px;">Lat: ${location.latitude.toFixed(6)}, Lon: ${location.longitude.toFixed(6)}</small>
          </div>
          <button id="save-favorite-btn" class="mod-secondary" style="padding: 4px 8px; font-size: 12px;">⭐ Guardar</button>
        </div>
      `;

      // Botón para guardar como favorita
      const saveFavoriteBtn = document.getElementById("save-favorite-btn");
      if (saveFavoriteBtn) {
        saveFavoriteBtn.addEventListener("click", async () => {
          await this.saveAsFavorite(location);
          saveFavoriteBtn.textContent = "✓ Guardado";
          saveFavoriteBtn.setAttribute("disabled", "true");
        });
      }

      confirmButton.removeAttribute("disabled");
    }

    if (resultsContainer) {
      resultsContainer.style.display = "none";
    }
  }

  // Guardar ubicación como favorita
  private async saveAsFavorite(location: { name: string; latitude: number; longitude: number; radius: number; address?: string }) {
    const newLocation: SavedLocation = {
      name: location.name,
      latitude: location.latitude,
      longitude: location.longitude,
      radius: location.radius,
      address: location.address
    };

    // Verificar si ya existe
    const exists = this.plugin.settings.savedLocations.some(
      loc => loc.name === location.name && loc.latitude === location.latitude && loc.longitude === location.longitude
    );

    if (!exists) {
      this.plugin.settings.savedLocations.push(newLocation);
      await this.plugin.saveSettings();
      
      // Actualizar lista de favoritas
      const favoritesList = document.querySelector(".notelert-location-favorites-list");
      if (favoritesList) {
        this.renderFavorites(favoritesList as HTMLElement);
      }
    }
  }

  // Renderizar lista de favoritas
  private renderFavorites(container: HTMLElement) {
    container.innerHTML = "";
    const savedLocations = this.plugin.settings.savedLocations || [];
    
    if (savedLocations.length === 0) {
      container.createEl("p", { 
        text: getTranslation(this.language, "locationPicker.noFavorites") || "No hay ubicaciones guardadas",
        attr: { style: "color: var(--text-muted); font-size: 12px; padding: 10px; text-align: center;" }
      });
    } else {
      savedLocations.forEach((location) => {
        const locationItem = container.createEl("div", { cls: "notelert-location-favorite-item" });
        locationItem.setAttribute("style", "padding: 10px; margin: 5px 0; border: 1px solid var(--background-modifier-border); border-radius: 4px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: background 0.2s;");
        
        locationItem.addEventListener("mouseenter", () => {
          locationItem.style.background = "var(--background-modifier-hover)";
        });
        locationItem.addEventListener("mouseleave", () => {
          locationItem.style.background = "";
        });

        const locationInfo = locationItem.createEl("div");
        locationInfo.createEl("div", { 
          text: location.name,
          attr: { style: "font-weight: 500; margin-bottom: 4px;" }
        });
        if (location.address) {
          locationInfo.createEl("div", { 
            text: location.address.length > 50 ? location.address.substring(0, 50) + "..." : location.address,
            attr: { style: "font-size: 11px; color: var(--text-muted);" }
          });
        }

        const selectButton = locationItem.createEl("button", {
          text: "Seleccionar",
          cls: "mod-secondary"
        });
        selectButton.setAttribute("style", "padding: 4px 12px; font-size: 12px;");
        selectButton.addEventListener("click", (e) => {
          e.stopPropagation();
          this.selectLocation({
            name: location.name,
            latitude: location.latitude,
            longitude: location.longitude,
            radius: location.radius,
            address: location.address
          });
        });
      });
    }
  }

  // Crear notificación directamente desde el location picker
  private async createNotificationFromLocation(locationName: string, latitude: number, longitude: number, radius: number) {
    try {
      // Reemplazar :# con :#nombreUbicacion
      const replacement = `:#${locationName}`;
      const line = this.editor.getLine(this.cursor.line);
      const beforeCursor = line.substring(0, this.cursor.ch - 2); // Quitar :#
      const afterCursor = line.substring(this.cursor.ch);
      const newLine = beforeCursor + replacement + afterCursor;
      
      this.editor.setLine(this.cursor.line, newLine);
      
      // Mover cursor al final del reemplazo
      const newCursor = {
        line: this.cursor.line,
        ch: beforeCursor.length + replacement.length
      };
      this.editor.setCursor(newCursor);

      // Crear el patrón detectado
      const pattern: DetectedPattern = {
        text: newLine.trim(),
        title: this.extractTitleFromText(newLine, replacement),
        message: newLine.trim(),
        date: new Date().toISOString().split('T')[0], // Fecha actual por defecto
        time: "00:00", // Hora por defecto para recordatorios de ubicación
        fullMatch: replacement,
        startIndex: 0,
        endIndex: newLine.length,
        filePath: this.plugin.app.workspace.getActiveFile()?.path,
        lineNumber: this.cursor.line + 1,
        location: locationName,
        latitude: latitude,
        longitude: longitude,
        radius: radius
      };

      // Crear la notificación directamente
      await this.plugin.createNotificationAndMarkProcessed(pattern);
      
      this.plugin.log(`Notificación de ubicación creada: ${pattern.title} en ${locationName}`);
    } catch (error) {
      this.plugin.log(`Error creando notificación de ubicación: ${error}`);
      new Notice(getTranslation(this.language, "notices.errorCreatingNotification", { title: "Recordatorio de ubicación" }));
    }
  }

  // Extraer título del texto
  private extractTitleFromText(text: string, match: string): string {
    // Remover el patrón :#ubicación del texto
    let title = text.replace(match, '').trim();
    
    // Limpiar espacios extra
    title = title.replace(/\s+/g, ' ').trim();
    
    // Limitar longitud
    if (title.length > 50) {
      title = title.substring(0, 47) + '...';
    }
    
    return title || 'Recordatorio de ubicación';
  }
}

