import { App, Modal, Notice } from "obsidian";
import { DetectedPattern, SavedLocation } from "../core/types";
import { getTranslation } from "../i18n";
import { INotelertPlugin } from "../core/plugin-interface";
import { searchLocations, GeocodingResult } from "../features/location/geocode";

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
  private map: any = null; // Google Maps instance
  private mapMarker: any = null; // Marker on map
  private mapLoaded: boolean = false;

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
    
    // Estilos responsive mejorados - modal más compacto
    contentEl.setAttribute("style", `
      min-width: 320px; 
      max-width: 600px; 
      width: 90vw;
      max-height: 85vh; 
      overflow-y: auto;
      padding: 20px;
      box-sizing: border-box;
    `);

    // Título
    const title = contentEl.createEl("h2", { 
      text: getTranslation(this.language, "locationPicker.title") || "Seleccionar Ubicación",
      attr: { style: "margin: 0 0 15px 0; font-size: 20px; font-weight: 600;" }
    });

    // Instrucción para el usuario
    const instruction = contentEl.createEl("p", {
      text: getTranslation(this.language, "locationPicker.selectLocation") || "Busca una dirección o haz clic en el mapa para seleccionar una ubicación",
      attr: { style: "color: var(--text-muted); font-size: 13px; margin-bottom: 15px; font-style: italic; line-height: 1.4;" }
    });

    // Input para buscar dirección con contenedor relativo para el desplegable
    const searchContainer = contentEl.createEl("div", { cls: "notelert-location-search" });
    searchContainer.setAttribute("style", `
      margin-bottom: 15px; 
      position: relative;
      z-index: 1000;
    `);
    
    const searchInput = searchContainer.createEl("input", {
      type: "text",
      placeholder: getTranslation(this.language, "locationPicker.searchPlaceholder") || "Buscar dirección...",
      cls: "notelert-location-input"
    });
    searchInput.setAttribute("style", `
      width: 100%; 
      padding: 12px; 
      border: 1px solid var(--background-modifier-border); 
      border-radius: 6px;
      font-size: 14px;
      box-sizing: border-box;
      background: var(--background-primary);
      color: var(--text-normal);
    `);

    // Contenedor para resultados de búsqueda - posicionado absolutamente DENTRO del searchContainer
    const resultsContainer = searchContainer.createEl("div", { cls: "notelert-location-results" });
    resultsContainer.setAttribute("style", `
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
    `);
    resultsContainer.id = "location-results-container";

    // Contenedor para el mapa interactivo - más compacto
    const mapContainer = contentEl.createEl("div", { cls: "notelert-map-container" });
    mapContainer.setAttribute("style", `
      width: 100%;
      height: 250px;
      min-height: 200px;
      margin: 15px 0;
      border: 1px solid var(--background-modifier-border);
      border-radius: 6px;
      overflow: hidden;
      background: var(--background-secondary);
      position: relative;
    `);
    mapContainer.id = "notelert-map-container";

    // Mensaje de carga/error del mapa
    const mapLoading = mapContainer.createEl("div", {
      text: getTranslation(this.language, "locationPicker.loadingMap") || "Cargando mapa...",
      attr: { 
        style: `
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: var(--text-muted);
          font-size: 14px;
          z-index: 1;
          text-align: center;
          padding: 10px;
        `
      }
    });
    mapLoading.id = "map-loading";

    // Contenedor para ubicación seleccionada
    const selectedContainer = contentEl.createEl("div", { cls: "notelert-location-selected" });
    selectedContainer.setAttribute("style", `
      margin: 15px 0; 
      padding: 15px; 
      background: var(--background-secondary); 
      border-radius: 6px; 
      display: none; 
      word-wrap: break-word;
      border: 2px solid var(--interactive-accent);
    `);
    selectedContainer.id = "location-selected-container";

    // Sección de favoritas (colapsable en móvil)
    const favoritesSection = contentEl.createEl("div", { cls: "notelert-location-favorites" });
    favoritesSection.setAttribute("style", "margin: 15px 0;");
    
    const favoritesHeader = favoritesSection.createEl("div", {
      attr: { 
        style: `
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
          cursor: pointer;
        `
      }
    });
    
    favoritesHeader.createEl("h3", { 
      text: getTranslation(this.language, "locationPicker.favorites") || "Ubicaciones Favoritas",
      attr: { style: "font-size: 16px; font-weight: 500; margin: 0;" }
    });

    const favoritesList = favoritesSection.createEl("div", { cls: "notelert-location-favorites-list" });
    favoritesList.setAttribute("style", `
      max-height: 150px; 
      overflow-y: auto;
      margin-top: 10px;
    `);

    this.renderFavorites(favoritesList);

    // Botones principales (mejorados para móvil)
    const buttonContainer = contentEl.createEl("div", { cls: "notelert-locationpicker-buttons" });
    buttonContainer.setAttribute("style", `
      display: flex; 
      gap: 10px; 
      justify-content: flex-end; 
      margin-top: 20px; 
      flex-wrap: wrap;
      position: sticky;
      bottom: 0;
      background: var(--background-primary);
      padding-top: 10px;
      z-index: 10;
    `);
    
    const cancelButton = buttonContainer.createEl("button", { 
      text: getTranslation(this.language, "locationPicker.cancelButton") || "Cancelar",
      cls: "mod-secondary"
    });
    cancelButton.setAttribute("style", `
      flex: 1; 
      min-width: 100px; 
      padding: 10px 20px;
      font-size: 14px;
      border-radius: 6px;
    `);
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
    confirmButton.setAttribute("style", `
      flex: 1; 
      min-width: 100px; 
      padding: 10px 20px;
      font-size: 14px;
      border-radius: 6px;
      opacity: 0.5;
      cursor: not-allowed;
    `);
    confirmButton.addEventListener("click", () => {
      if (this.selectedLocation) {
        this.createNotificationFromLocation(
          this.selectedLocation.name,
          this.selectedLocation.latitude,
          this.selectedLocation.longitude,
          100 // Radio fijo de 100 metros
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
        // Asegurar que el contenedor de búsqueda tiene posición relativa
        const searchContainer = searchInput.parentElement;
        if (searchContainer && searchContainer.style.position !== 'relative') {
          searchContainer.style.position = 'relative';
        }
        return;
      }

      // Debounce: esperar 500ms después de que el usuario deje de escribir
      this.searchTimeout = window.setTimeout(() => {
        this.searchLocations(query, resultsContainer);
      }, 500);
    });

    // Cargar el mapa interactivo
    this.loadGoogleMap();
  }

  // Cargar Google Maps dinámicamente
  private loadGoogleMap() {
    // Verificar si Google Maps ya está cargado globalmente
    if ((window as any).google && (window as any).google.maps) {
      this.mapLoaded = true;
      // Pequeño delay para asegurar que el DOM está listo
      setTimeout(() => this.initMap(), 100);
      return;
    }

    // Verificar si el script ya está siendo cargado
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      // Esperar a que se cargue
      const checkInterval = setInterval(() => {
        if ((window as any).google && (window as any).google.maps) {
          clearInterval(checkInterval);
          this.mapLoaded = true;
          setTimeout(() => this.initMap(), 100);
        }
      }, 100);
      return;
    }

    // Crear callback único para esta instancia
    const callbackName = `initNotelertMap_${Date.now()}`;
    
    // Cargar el script de Google Maps
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBwR-GmihN8Xic-npwi6p4wTUwJ67ueWvk&libraries=places&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    
    // Manejo de errores del script
    script.onerror = () => {
      this.plugin.log('Error cargando Google Maps script');
      this.showMapError('Error al cargar Google Maps. Verifica tu conexión a internet.');
      delete (window as any)[callbackName];
    };
    
    // Callback global temporal para cuando el mapa esté listo
    (window as any)[callbackName] = () => {
      this.mapLoaded = true;
      // Limpiar el callback después de usarlo
      delete (window as any)[callbackName];
      setTimeout(() => this.initMap(), 100);
    };

    document.head.appendChild(script);
    
    // Timeout de seguridad (10 segundos)
    setTimeout(() => {
      if (!this.mapLoaded && !this.map) {
        this.plugin.log('Timeout cargando Google Maps');
        this.showMapError('Timeout cargando el mapa. Intenta recargar.');
      }
    }, 10000);
  }

  // Mostrar error en el mapa
  private showMapError(message: string) {
    const loading = document.getElementById('map-loading');
    if (loading) {
      loading.innerHTML = `
        <div style="color: var(--text-error); font-weight: 500; margin-bottom: 8px;">⚠️ Error</div>
        <div style="color: var(--text-muted); font-size: 12px;">${message}</div>
      `;
    }
  }

  // Inicializar el mapa
  private initMap() {
    try {
      const mapContainer = document.getElementById('notelert-map-container');
      if (!mapContainer) {
        this.plugin.log('Contenedor del mapa no encontrado');
        return;
      }

      // Verificar que Google Maps está disponible
      if (!(window as any).google || !(window as any).google.maps) {
        this.plugin.log('Google Maps API no disponible');
        this.showMapError('Google Maps no está disponible. Recarga la página.');
        return;
      }

      // Ocultar mensaje de carga
      const loading = document.getElementById('map-loading');
      if (loading) loading.style.display = 'none';

      // Coordenadas por defecto (centro del mundo o última ubicación seleccionada)
      const defaultCenter = this.selectedLocation 
        ? { lat: this.selectedLocation.latitude, lng: this.selectedLocation.longitude }
        : { lat: 40.4168, lng: -3.7038 }; // Madrid por defecto

      // Crear el mapa
      this.map = new (window as any).google.maps.Map(mapContainer, {
        center: defaultCenter,
        zoom: 13,
        mapTypeControl: true,
        streetViewControl: false, // Desactivado para ahorrar espacio
        fullscreenControl: false, // Desactivado para ahorrar espacio
        zoomControl: true,
        mapTypeControlOptions: {
          style: (window as any).google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
          position: (window as any).google.maps.ControlPosition.TOP_RIGHT
        }
      });

      // Listener para errores del mapa
      this.map.addListener('error', () => {
        this.plugin.log('Error en el mapa de Google Maps');
        this.showMapError('Error al cargar el mapa. Verifica tu conexión.');
      });

      // Listener para clics en el mapa
      this.map.addListener('click', (e: any) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        
        // Geocodificación inversa para obtener la dirección
        this.reverseGeocode(lat, lng);
      });

      // Si hay una ubicación seleccionada, mostrarla
      if (this.selectedLocation) {
        this.updateMapMarker(this.selectedLocation.latitude, this.selectedLocation.longitude);
      }

      this.plugin.log('Mapa inicializado correctamente');
    } catch (error: any) {
      this.plugin.log(`Error inicializando mapa: ${error?.message || error}`);
      this.showMapError(`Error: ${error?.message || 'Error desconocido'}`);
    }
  }

  // Geocodificación inversa (de coordenadas a dirección)
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
            radius: 100,
            address: address
          });

          // Actualizar marcador en el mapa
          this.updateMapMarker(lat, lng);
        } else {
          // Si falla la geocodificación, usar coordenadas directamente
          this.selectLocation({
            name: `Ubicación (${lat.toFixed(6)}, ${lng.toFixed(6)})`,
            latitude: lat,
            longitude: lng,
            radius: 100
          });
          this.updateMapMarker(lat, lng);
        }
      });
    } catch (error) {
      this.plugin.log(`Error en geocodificación inversa: ${error}`);
      // Usar coordenadas directamente si falla
      this.selectLocation({
        name: `Ubicación (${lat.toFixed(6)}, ${lng.toFixed(6)})`,
        latitude: lat,
        longitude: lng,
        radius: 100
      });
      this.updateMapMarker(lat, lng);
    }
  }

  // Actualizar marcador en el mapa
  private updateMapMarker(lat: number, lng: number) {
    if (!this.map) return;

    // Eliminar marcador anterior
    if (this.mapMarker) {
      this.mapMarker.setMap(null);
    }

    // Crear nuevo marcador
    this.mapMarker = new (window as any).google.maps.Marker({
      position: { lat, lng },
      map: this.map,
      draggable: true,
      animation: (window as any).google.maps.Animation.DROP
    });

    // Listener para cuando se arrastra el marcador
    this.mapMarker.addListener('dragend', (e: any) => {
      const newLat = e.latLng.lat();
      const newLng = e.latLng.lng();
      this.reverseGeocode(newLat, newLng);
    });

    // Centrar el mapa en la nueva ubicación
    this.map.setCenter({ lat, lng });
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    // Limpiar mapa
    if (this.mapMarker) {
      this.mapMarker.setMap(null);
      this.mapMarker = null;
    }
    this.map = null;
    this.mapLoaded = false;
  }

  // Buscar ubicaciones usando el proveedor configurado
  private async searchLocations(query: string, resultsContainer: HTMLElement) {
    try {
      resultsContainer.style.display = "block";
      resultsContainer.innerHTML = `<div style='padding: 20px; text-align: center; color: var(--text-muted);'>${getTranslation(this.language, "locationPicker.searching") || "Buscando..."}</div>`;

      this.plugin.log(`Buscando ubicaciones: ${query}`);
      
      // Usar el sistema de geocodificación modular
      const results = await searchLocations(
        query,
        this.plugin.settings,
        this.language || 'es',
        (msg) => this.plugin.log(msg)
      );

      this.plugin.log(`Resultados encontrados: ${results.length}`);

      if (results.length === 0) {
        resultsContainer.innerHTML = `<div style='padding: 20px; text-align: center; color: var(--text-muted);'>${getTranslation(this.language, "locationPicker.noResults") || "No se encontraron resultados"}</div>`;
        return;
      }

      // Mostrar resultados
      resultsContainer.innerHTML = "";
      results.forEach((result: GeocodingResult) => {
        try {
          const resultItem = resultsContainer.createEl("div", { cls: "notelert-location-result-item" });
          resultItem.setAttribute("style", "padding: 12px; margin: 5px 0; border: 1px solid var(--background-modifier-border); border-radius: 4px; cursor: pointer; transition: background 0.2s; word-wrap: break-word;");
          
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
            if (isNaN(result.latitude) || isNaN(result.longitude)) {
              this.plugin.log(`Coordenadas inválidas: lat=${result.latitude}, lon=${result.longitude}`);
              new Notice(getTranslation(this.language, "locationPicker.error") || "Error: Coordenadas inválidas");
              return;
            }
            
            this.selectLocation({
              name: result.name,
              latitude: result.latitude,
              longitude: result.longitude,
              radius: 100,
              address: result.displayName
            });

            // Actualizar mapa con la ubicación seleccionada
            if (this.map) {
              this.updateMapMarker(result.latitude, result.longitude);
            }
          });
        } catch (itemError) {
          this.plugin.log(`Error procesando resultado: ${itemError}`);
        }
      });
    } catch (error: any) {
      const errorMessage = error?.message || String(error);
      this.plugin.log(`Error buscando ubicaciones: ${errorMessage}`);
      this.plugin.log(`Stack: ${error?.stack || 'No stack trace'}`);
      
      let errorDisplay = getTranslation(this.language, "locationPicker.error") || "Error al buscar ubicaciones";
      if (errorMessage.includes("CORS") || errorMessage.includes("Failed to fetch")) {
        errorDisplay = getTranslation(this.language, "locationPicker.connectionError") || "Error de conexión. Verifica tu conexión a internet.";
      } else if (errorMessage.includes("429")) {
        errorDisplay = getTranslation(this.language, "locationPicker.rateLimit") || "Demasiadas solicitudes. Espera un momento antes de buscar de nuevo.";
      } else if (errorMessage.includes("API key")) {
        errorDisplay = getTranslation(this.language, "locationPicker.apiKeyError") || "Error: API key no configurada o inválida. Verifica la configuración.";
      } else if (errorMessage) {
        errorDisplay = `${getTranslation(this.language, "locationPicker.error") || "Error"}: ${errorMessage}`;
      }
      
      resultsContainer.innerHTML = `<div style='padding: 20px; text-align: center; color: var(--text-error);'>${errorDisplay}</div>`;
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
      const saveFavoriteText = getTranslation(this.language, "locationPicker.saveFavorite") || "⭐ Guardar";
      selectedContainer.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: start; flex-wrap: wrap; gap: 10px;">
          <div style="flex: 1; min-width: 200px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <span style="font-size: 18px;">📍</span>
              <strong style="word-wrap: break-word; font-size: 15px;">${location.name}</strong>
            </div>
            <small style="color: var(--text-muted); word-wrap: break-word; display: block; margin-bottom: 4px;">${location.address || ''}</small>
            <small style="color: var(--text-muted); font-size: 10px;">Lat: ${location.latitude.toFixed(6)}, Lon: ${location.longitude.toFixed(6)}</small>
          </div>
          <button id="save-favorite-btn" class="mod-secondary" style="padding: 4px 8px; font-size: 12px; white-space: nowrap; flex-shrink: 0;">${saveFavoriteText}</button>
        </div>
      `;

      // Botón para guardar como favorita
      const saveFavoriteBtn = document.getElementById("save-favorite-btn");
      if (saveFavoriteBtn) {
        saveFavoriteBtn.addEventListener("click", async () => {
          await this.saveAsFavorite(location);
          saveFavoriteBtn.textContent = getTranslation(this.language, "locationPicker.saved") || "✓ Guardado";
          saveFavoriteBtn.setAttribute("disabled", "true");
        });
      }

      confirmButton.removeAttribute("disabled");
      confirmButton.style.opacity = "1";
      confirmButton.style.cursor = "pointer";
    }

    if (resultsContainer) {
      resultsContainer.style.display = "none";
    }

    // Actualizar mapa si está cargado
    if (this.map) {
      this.updateMapMarker(location.latitude, location.longitude);
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

  // Eliminar ubicación favorita
  private async deleteFavorite(location: SavedLocation) {
    const index = this.plugin.settings.savedLocations.findIndex(
      loc => loc.name === location.name && 
            loc.latitude === location.latitude && 
            loc.longitude === location.longitude
    );

    if (index !== -1) {
      this.plugin.settings.savedLocations.splice(index, 1);
      await this.plugin.saveSettings();
      this.plugin.log(`Ubicación favorita eliminada: ${location.name}`);
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
      savedLocations.forEach((location, index) => {
        const locationItem = container.createEl("div", { cls: "notelert-location-favorite-item" });
        locationItem.setAttribute("style", "padding: 10px; margin: 5px 0; border: 1px solid var(--background-modifier-border); border-radius: 4px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: background 0.2s; flex-wrap: wrap; gap: 8px;");
        
        locationItem.addEventListener("mouseenter", () => {
          locationItem.style.background = "var(--background-modifier-hover)";
        });
        locationItem.addEventListener("mouseleave", () => {
          locationItem.style.background = "";
        });

        const locationInfo = locationItem.createEl("div");
        locationInfo.setAttribute("style", "flex: 1; min-width: 0; margin-right: 10px;");
        locationInfo.createEl("div", { 
          text: location.name,
          attr: { style: "font-weight: 500; margin-bottom: 4px; word-wrap: break-word;" }
        });
        if (location.address) {
          locationInfo.createEl("div", { 
            text: location.address.length > 50 ? location.address.substring(0, 50) + "..." : location.address,
            attr: { style: "font-size: 11px; color: var(--text-muted); word-wrap: break-word;" }
          });
        }

        // Contenedor para botones
        const buttonsContainer = locationItem.createEl("div");
        buttonsContainer.setAttribute("style", "display: flex; gap: 6px; flex-shrink: 0;");

        const selectButton = buttonsContainer.createEl("button", {
          text: getTranslation(this.language, "locationPicker.selectButton") || "Seleccionar",
          cls: "mod-secondary"
        });
        selectButton.setAttribute("style", "padding: 4px 12px; font-size: 12px; white-space: nowrap;");
        selectButton.addEventListener("click", (e) => {
          e.stopPropagation();
          this.selectLocation({
            name: location.name,
            latitude: location.latitude,
            longitude: location.longitude,
            radius: location.radius,
            address: location.address
          });

          // Actualizar mapa
          if (this.map) {
            this.updateMapMarker(location.latitude, location.longitude);
          }
        });

        // Botón para eliminar favorita
        const deleteButton = buttonsContainer.createEl("button", {
          text: "🗑️",
          title: getTranslation(this.language, "locationPicker.deleteButton") || "Eliminar"
        });
        deleteButton.setAttribute("style", "padding: 4px 8px; font-size: 14px; background: var(--background-modifier-border); border: 1px solid var(--background-modifier-border); border-radius: 4px; cursor: pointer; color: var(--text-error);");
        deleteButton.addEventListener("click", async (e) => {
          e.stopPropagation();
          await this.deleteFavorite(location);
          this.renderFavorites(container);
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

