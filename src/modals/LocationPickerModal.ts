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
    
    // Estilos responsive mejorados - modal centrado y sin scroll visible
    contentEl.setAttribute("style", `
      min-width: 320px; 
      max-width: 700px; 
      width: 90vw;
      max-height: 90vh; 
      overflow: hidden;
      padding: 20px;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      margin: 0 auto;
    `);

    // Contenedor con scroll interno para el contenido
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
    scrollContainer.id = "notelert-modal-scroll-container";

    // Título
    scrollContainer.createEl("h2", { 
      text: getTranslation(this.language, "locationPicker.title") || "Seleccionar Ubicación",
      attr: { style: "margin: 0 0 15px 0; font-size: 20px; font-weight: 600;" }
    });

    // Instrucción para el usuario
    scrollContainer.createEl("p", {
      text: getTranslation(this.language, "locationPicker.selectLocation") || "Busca una dirección o haz clic en el mapa para seleccionar una ubicación",
      attr: { style: "color: var(--text-muted); font-size: 13px; margin-bottom: 15px; font-style: italic; line-height: 1.4;" }
    });

    // Área de debug SIEMPRE PRIMERO (antes del mapa) para que no se comprima
    const debugContainer = scrollContainer.createEl("div", {
      attr: {
        style: `
          margin: 15px 0;
          padding: 15px;
          background: var(--background-secondary);
          border: 2px solid var(--background-modifier-border);
          border-radius: 8px;
          font-size: 12px;
          height: 250px;
          min-height: 250px;
          overflow-y: auto;
          overflow-x: hidden;
          font-family: 'Courier New', monospace;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          flex-shrink: 0;
        `
      }
    });
    debugContainer.id = "notelert-debug-container";
    debugContainer.innerHTML = `
      <div style="font-weight: 700; margin-bottom: 12px; color: var(--text-accent); font-size: 14px; border-bottom: 1px solid var(--background-modifier-border); padding-bottom: 8px;">
        🔍 Debug del Mapa
      </div>
      <div id="map-debug-info" style="color: var(--text-normal); line-height: 1.8; word-wrap: break-word; min-height: 200px;"></div>
    `;

    // Input para buscar dirección con contenedor relativo para el desplegable
    const searchContainer = scrollContainer.createEl("div", { cls: "notelert-location-search" });
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
    const mapContainer = scrollContainer.createEl("div", { cls: "notelert-map-container" });
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
      attr: { 
        style: `
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: var(--text-muted);
          font-size: 14px;
          z-index: 1000;
          text-align: center;
          padding: 15px;
          background: var(--background-primary);
          border: 2px solid var(--text-error);
          border-radius: 6px;
          max-width: 90%;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        `
      }
    });
    mapLoading.id = "map-loading";
    mapLoading.innerHTML = `
      <div style="font-weight: 500; margin-bottom: 8px;">${getTranslation(this.language, "locationPicker.loadingMap") || "Cargando mapa..."}</div>
    `;

    // Botón para mostrar/ocultar debug (solo si está en modo debug)
    if (this.plugin.settings.debugMode) {
      const debugToggle = contentEl.createEl("button", {
        text: "🔍 Debug Mapa",
        attr: {
          style: `
            position: absolute;
            top: 10px;
            right: 10px;
            padding: 6px 12px;
            font-size: 11px;
            background: var(--background-secondary);
            border: 1px solid var(--background-modifier-border);
            border-radius: 4px;
            cursor: pointer;
            z-index: 2000;
          `
        }
      });
      debugToggle.addEventListener("click", () => {
        const debugInfo = document.getElementById("map-debug-info");
        if (debugInfo) {
          debugInfo.style.display = debugInfo.style.display === "none" ? "block" : "none";
        }
      });
    }

    // Contenedor para ubicación seleccionada
    const selectedContainer = scrollContainer.createEl("div", { cls: "notelert-location-selected" });
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
    const favoritesSection = scrollContainer.createEl("div", { cls: "notelert-location-favorites" });
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

    // Botones principales (fuera del scroll, siempre visibles)
    const buttonContainer = contentEl.createEl("div", { cls: "notelert-locationpicker-buttons" });
    buttonContainer.setAttribute("style", `
      display: flex; 
      gap: 10px; 
      justify-content: flex-end; 
      margin-top: 10px; 
      flex-wrap: wrap;
      flex-shrink: 0;
      padding-top: 10px;
      border-top: 1px solid var(--background-modifier-border);
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
    this.addDebugInfo('Iniciando carga de Google Maps...');
    
    // Verificar si Google Maps ya está cargado globalmente
    if ((window as any).google && (window as any).google.maps) {
      this.addDebugInfo('✅ Google Maps ya está cargado');
      this.mapLoaded = true;
      // Pequeño delay para asegurar que el DOM está listo
      setTimeout(() => this.initMap(), 100);
      return;
    }

    // Verificar si el script ya está siendo cargado
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      this.addDebugInfo('⏳ Script de Google Maps ya está siendo cargado, esperando...');
      // Esperar a que se cargue
      let attempts = 0;
      const maxAttempts = 50; // 5 segundos máximo
      const checkInterval = setInterval(() => {
        attempts++;
        if ((window as any).google && (window as any).google.maps) {
          clearInterval(checkInterval);
          this.addDebugInfo('✅ Google Maps cargado después de esperar');
          this.mapLoaded = true;
          setTimeout(() => this.initMap(), 100);
        } else if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          this.addDebugInfo('❌ Timeout esperando que se cargue el script existente');
          this.showMapError('Timeout esperando que se cargue Google Maps', 'El script estaba cargándose pero no se completó. Intenta recargar la página.');
        }
      }, 100);
      return;
    }

    // Crear callback único para esta instancia
    const callbackName = `initNotelertMap_${Date.now()}`;
    this.addDebugInfo(`📝 Creando callback: ${callbackName}`);
    
    // Cargar el script de Google Maps
    // NOTA: El mapa interactivo requiere una API key de Google Maps del usuario
    // La geocodificación usa el proxy de Firebase (sin API key requerida)
    const apiKey = this.plugin.settings.googleMapsApiKey?.trim() || '';
    
    if (!apiKey) {
      this.addDebugInfo('⚠️ API key de Google Maps no configurada');
      this.addDebugInfo('ℹ️ El mapa interactivo no estará disponible, pero puedes buscar ubicaciones usando el campo de búsqueda');
      this.showMapError(
        'Mapa no disponible',
        'Para usar el mapa interactivo, configura tu API key de Google Maps en Settings.<br><br>La búsqueda de ubicaciones seguirá funcionando usando el proxy de Firebase.'
      );
      return;
    }
    
    const script = document.createElement('script');
    const scriptUrl = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=${callbackName}`;
    script.src = scriptUrl;
    script.async = true;
    script.defer = true;
    
    this.addDebugInfo('📡 Cargando script de Google Maps...');
    
    // Manejo de errores del script
    script.onerror = (error) => {
      this.addDebugInfo('❌ Error en script.onerror');
      const errorDetails = `
        <strong>Error cargando script:</strong><br>
        Verifica:<br>
        - Tu conexión a internet<br>
        - Que la API key sea válida<br>
        - Que la Geocoding API esté habilitada en Google Cloud<br>
        - Que la Maps JavaScript API esté habilitada en Google Cloud
      `;
      this.showMapError('Error al cargar Google Maps. Verifica tu conexión a internet.', errorDetails);
      delete (window as any)[callbackName];
    };
    
    // Callback global temporal para cuando el mapa esté listo
    (window as any)[callbackName] = () => {
      this.addDebugInfo('✅ Callback ejecutado - Google Maps cargado');
      this.mapLoaded = true;
      // Limpiar el callback después de usarlo
      delete (window as any)[callbackName];
      setTimeout(() => this.initMap(), 100);
    };

    document.head.appendChild(script);
    this.addDebugInfo('📦 Script añadido al DOM');
    
    // Timeout de seguridad (10 segundos)
    setTimeout(() => {
      if (!this.mapLoaded && !this.map) {
        this.addDebugInfo('⏱️ Timeout después de 10 segundos');
        const timeoutDetails = `
          <strong>Timeout cargando el mapa:</strong><br>
          Estado: mapLoaded=${this.mapLoaded}, map=${this.map ? 'existe' : 'null'}<br>
          Google disponible: ${(window as any).google ? 'sí' : 'no'}<br>
          Verifica:<br>
          - Tu conexión a internet<br>
          - Que no haya bloqueadores de scripts<br>
          - La consola del navegador para más detalles
        `;
        this.showMapError('Timeout cargando el mapa. Intenta recargar.', timeoutDetails);
      }
    }, 10000);
  }

  // Mostrar error en el mapa con información de debug
  private showMapError(message: string, details?: string) {
    const loading = document.getElementById('map-loading');
    const debugInfo = document.getElementById('map-debug-info');
    
    if (loading) {
      loading.innerHTML = `
        <div style="color: var(--text-error); font-weight: 500; margin-bottom: 8px;">⚠️ Error</div>
        <div style="color: var(--text-muted); font-size: 12px; margin-bottom: 8px;">${message}</div>
        ${details ? `<div id="map-debug-info" style="font-size: 11px; color: var(--text-muted); text-align: left; max-height: 100px; overflow-y: auto; background: var(--background-secondary); padding: 8px; border-radius: 4px; margin-top: 8px;">${details}</div>` : ''}
      `;
    }
    
    if (debugInfo && details) {
      debugInfo.innerHTML = details;
      debugInfo.style.display = 'block';
    }
  }

  // Añadir información de debug
  private addDebugInfo(message: string) {
    const debugInfo = document.getElementById('map-debug-info');
    if (debugInfo) {
      const timestamp = new Date().toLocaleTimeString();
      const existing = debugInfo.innerHTML || '';
      const color = message.includes('❌') || message.includes('Error') || message.includes('Excepción') ? 'var(--text-error)' : 
                   message.includes('✅') ? 'var(--text-success)' : 
                   message.includes('⚠️') ? 'var(--text-warning)' :
                   'var(--text-normal)';
      const bgColor = message.includes('❌') || message.includes('Error') || message.includes('Excepción') ? 'rgba(255, 0, 0, 0.1)' : 
                     message.includes('✅') ? 'rgba(0, 255, 0, 0.1)' : 'transparent';
      debugInfo.innerHTML = `${existing}<div style="margin: 4px 0; padding: 6px 8px; font-size: 11px; color: ${color}; background: ${bgColor}; border-left: 3px solid ${color}; border-radius: 3px; word-wrap: break-word; white-space: pre-wrap;"><span style="opacity: 0.7;">[${timestamp}]</span> ${message}</div>`;
      // Auto-scroll al final
      const container = document.getElementById('notelert-debug-container');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
    // También loggear en consola si está disponible
    this.plugin.log(`[Mapa] ${message}`);
  }

  // Inicializar el mapa
  private initMap() {
    try {
      this.addDebugInfo('🗺️ Iniciando inicialización del mapa...');
      
      const mapContainer = document.getElementById('notelert-map-container');
      if (!mapContainer) {
        this.addDebugInfo('❌ Contenedor del mapa no encontrado');
        this.showMapError('Contenedor del mapa no encontrado', 'El elemento #notelert-map-container no existe en el DOM');
        return;
      }
      this.addDebugInfo('✅ Contenedor encontrado');

      // Verificar que Google Maps está disponible
      if (!(window as any).google) {
        this.addDebugInfo('❌ window.google no existe');
        this.showMapError('Google Maps no está disponible', 'window.google no está definido. El script no se cargó correctamente.');
        return;
      }
      
      if (!(window as any).google.maps) {
        this.addDebugInfo('❌ window.google.maps no existe');
        this.showMapError('Google Maps API no disponible', 'window.google.maps no está definido. Verifica que el script se cargó correctamente.');
        return;
      }
      this.addDebugInfo('✅ Google Maps API disponible');

      // Ocultar mensaje de carga
      const loading = document.getElementById('map-loading');
      if (loading) {
        loading.style.display = 'none';
        this.addDebugInfo('✅ Mensaje de carga ocultado');
      }

      // Coordenadas por defecto (centro del mundo o última ubicación seleccionada)
      const defaultCenter = this.selectedLocation 
        ? { lat: this.selectedLocation.latitude, lng: this.selectedLocation.longitude }
        : { lat: 40.4168, lng: -3.7038 }; // Madrid por defecto
      
      this.addDebugInfo(`📍 Centro: ${defaultCenter.lat}, ${defaultCenter.lng}`);

      // Crear el mapa
      this.addDebugInfo('🔨 Creando instancia del mapa...');
      
      try {
        this.map = new (window as any).google.maps.Map(mapContainer, {
          center: defaultCenter,
          zoom: 13,
          mapTypeControl: false, // Desactivado - sin botones de mapa/satélite
          streetViewControl: false, // Desactivado
          fullscreenControl: false, // Desactivado
          zoomControl: false, // Desactivado - sin botones de zoom
          disableDefaultUI: false, // Mantener otros controles por defecto si los hay
          gestureHandling: 'cooperative' // Permitir zoom con scroll pero sin controles
        });
        this.addDebugInfo('✅ Mapa creado');

        // Ocultar mensaje de carga después de un momento
        setTimeout(() => {
          const loading = document.getElementById('map-loading');
          if (loading) {
            loading.style.display = 'none';
            this.addDebugInfo('✅ Mensaje de carga ocultado');
          }
        }, 500);

        // Listener para errores del mapa (puede no funcionar siempre)
        try {
          this.map.addListener('error', (error: any) => {
            this.addDebugInfo(`❌ Error en el mapa (listener): ${error?.message || JSON.stringify(error)}`);
            this.showMapError('Error al cargar el mapa', `Error del mapa: ${error?.message || 'Error desconocido'}`);
          });
        } catch (listenerError) {
          this.addDebugInfo(`⚠️ No se pudo añadir listener de errores: ${listenerError}`);
        }

        // Verificar si el mapa se cargó correctamente después de un momento
        setTimeout(() => {
          this.checkMapStatus();
        }, 2000);

      } catch (mapError: any) {
        this.addDebugInfo(`❌ Excepción al crear mapa: ${mapError?.message || mapError}`);
        this.addDebugInfo(`Stack: ${mapError?.stack?.substring(0, 200) || 'No stack'}`);
        throw mapError;
      }

      // Listener para clics en el mapa
      this.map.addListener('click', (e: any) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        this.addDebugInfo(`🖱️ Click en mapa: ${lat}, ${lng}`);
        
        // Geocodificación inversa para obtener la dirección
        this.reverseGeocode(lat, lng);
      });

      // Si hay una ubicación seleccionada, mostrarla
      if (this.selectedLocation) {
        this.addDebugInfo(`📍 Mostrando ubicación seleccionada: ${this.selectedLocation.name}`);
        this.updateMapMarker(this.selectedLocation.latitude, this.selectedLocation.longitude);
      }

      this.addDebugInfo('✅ Mapa inicializado correctamente');
    } catch (error: any) {
      const errorMessage = error?.message || String(error);
      const errorStack = error?.stack || 'No hay stack trace';
      this.addDebugInfo(`❌ Excepción: ${errorMessage}`);
      this.addDebugInfo(`Stack: ${errorStack.substring(0, 300)}`);
      const errorDetails = `
        <strong>Error al inicializar el mapa:</strong><br>
        Mensaje: ${errorMessage}<br>
        Stack: ${errorStack.substring(0, 200)}...<br>
        Tipo: ${error?.name || 'Unknown'}
      `;
      this.showMapError(`Error: ${errorMessage}`, errorDetails);
    }
  }

  // Verificar el estado del mapa después de cargar
  private checkMapStatus() {
    this.addDebugInfo('🔍 Verificando estado del mapa...');
    
    const mapContainer = document.getElementById('notelert-map-container');
    if (!mapContainer) {
      this.addDebugInfo('❌ Contenedor no encontrado en verificación');
      return;
    }

    this.addDebugInfo(`📦 Contenedor encontrado, tamaño: ${mapContainer.offsetWidth}x${mapContainer.offsetHeight}`);

    // Buscar el mensaje de error de Google Maps de múltiples formas
    let googleError: Element | null = null;
    let errorText = '';

    // Buscar por texto común en errores de Google Maps
    const allDivs = mapContainer.querySelectorAll('div');
    this.addDebugInfo(`🔎 Buscando en ${allDivs.length} elementos div...`);
    
    for (const div of Array.from(allDivs)) {
      const text = div.innerText || div.textContent || '';
      const lowerText = text.toLowerCase();
      
      // Buscar mensajes de error comunes
      if (lowerText.includes('no ha cargado') || 
          lowerText.includes('no se ha podido cargar') ||
          lowerText.includes('something went wrong') ||
          lowerText.includes('error') ||
          lowerText.includes('forbidden') ||
          lowerText.includes('unauthorized') ||
          lowerText.includes('api key')) {
        googleError = div;
        errorText = text;
        this.addDebugInfo(`❌ Error encontrado: "${text.substring(0, 100)}"`);
        break;
      }
    }

    // También buscar por atributos de estilo que indican error
    if (!googleError) {
      const errorDivs = mapContainer.querySelectorAll('div[style*="error"], div[style*="Error"], div[class*="error"]');
      if (errorDivs.length > 0) {
        googleError = errorDivs[0];
        errorText = (googleError as HTMLElement).innerText || (googleError as HTMLElement).textContent || '';
        this.addDebugInfo(`❌ Error encontrado por estilo: "${errorText.substring(0, 100)}"`);
      }
    }

    // Verificar si hay iframes (Google Maps a veces usa iframes)
    const iframes = mapContainer.querySelectorAll('iframe');
    this.addDebugInfo(`🖼️ Iframes encontrados: ${iframes.length}`);
    if (iframes.length > 0) {
      for (const iframe of Array.from(iframes)) {
        this.addDebugInfo(`  - Iframe src: ${iframe.src.substring(0, 80)}...`);
      }
    }
    
    if (googleError) {
      this.addDebugInfo(`❌ Error de Google Maps detectado: ${errorText}`);
      this.showMapError('Google Maps no se cargó correctamente', `
        <strong>Error detectado:</strong><br>
        ${errorText}<br><br>
        <strong>Posibles causas:</strong><br>
        - API key inválida o sin permisos<br>
        - Maps JavaScript API no habilitada (no solo Geocoding)<br>
        - Restricciones de la API key muy estrictas<br>
        - Límite de uso excedido<br>
        - Problema de conexión<br><br>
        <strong>Verifica en Google Cloud Console:</strong><br>
        1. Que "Maps JavaScript API" esté habilitada<br>
        2. Que la API key tenga permisos para Maps JavaScript API<br>
        3. Que las restricciones de la API key permitan tu uso
      `);
      return;
    }

    // Verificar si el mapa tiene tiles cargados
    if (this.map) {
      this.addDebugInfo('🗺️ Mapa existe, verificando tiles...');
      const tiles = mapContainer.querySelectorAll('img[src*="maps.googleapis.com"], img[src*="googleapis"], img[src*="gstatic"]');
      this.addDebugInfo(`🖼️ Tiles encontrados: ${tiles.length}`);
      
      if (tiles.length === 0) {
        this.addDebugInfo('⚠️ No se detectaron tiles del mapa cargados');
        this.addDebugInfo('🔍 Buscando cualquier imagen en el contenedor...');
        const allImages = mapContainer.querySelectorAll('img');
        this.addDebugInfo(`📸 Total imágenes: ${allImages.length}`);
        for (const img of Array.from(allImages)) {
          this.addDebugInfo(`  - Imagen src: ${(img as HTMLImageElement).src.substring(0, 80)}...`);
        }
        
        // Verificar si hay contenido HTML que indique error
        const containerHTML = mapContainer.innerHTML.substring(0, 500);
        this.addDebugInfo(`📄 Primeros 500 chars del HTML: ${containerHTML}`);
        
        this.showMapError('El mapa no muestra tiles', 'El mapa se creó pero no se están cargando las imágenes. Verifica tu conexión y la API key. Asegúrate de que "Maps JavaScript API" esté habilitada en Google Cloud.');
      } else {
        this.addDebugInfo(`✅ Mapa verificado: ${tiles.length} tiles cargados`);
        // Ocultar mensaje de carga si todo está bien
        const loading = document.getElementById('map-loading');
        if (loading) {
          loading.style.display = 'none';
        }
      }
    } else {
      this.addDebugInfo('⚠️ Mapa no está definido en verificación');
    }

    // Verificación adicional después de más tiempo
    setTimeout(() => {
      this.addDebugInfo('🔍 Verificación adicional después de 3 segundos...');
      this.checkMapStatusDelayed();
    }, 3000);
  }

  // Verificación adicional después de más tiempo
  private checkMapStatusDelayed() {
    const mapContainer = document.getElementById('notelert-map-container');
    if (!mapContainer) return;

    // Buscar errores que aparecen después
    const allText = mapContainer.innerText || mapContainer.textContent || '';
    if (allText.toLowerCase().includes('error') || 
        allText.toLowerCase().includes('no ha cargado') ||
        allText.toLowerCase().includes('forbidden')) {
      this.addDebugInfo(`❌ Error detectado en verificación tardía: ${allText.substring(0, 200)}`);
      this.showMapError('Error detectado en el mapa', allText.substring(0, 300));
    } else {
      this.addDebugInfo('✅ No se detectaron errores en verificación tardía');
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
      // Validar token si se usa Google Maps proxy (premium feature)
      const useProxy = (this.plugin.settings as any).useFirebaseProxy !== false;
      const provider = (this.plugin.settings as any).geocodingProvider || 'nominatim';
      
      if ((provider === 'google' && useProxy) || provider === 'google') {
        if (!this.plugin.settings.pluginToken || this.plugin.settings.pluginToken.trim() === '') {
          resultsContainer.style.display = "block";
          resultsContainer.innerHTML = `
            <div style='padding: 20px; text-align: center;'>
              <div style='color: var(--text-error); margin-bottom: 12px; font-weight: 600;'>
                🔑 Token del plugin requerido
              </div>
              <div style='color: var(--text-muted); font-size: 13px; line-height: 1.6;'>
                Para usar geocodificación premium (Google Maps), necesitas:<br/>
                1. Tener plan Premium activo<br/>
                2. Generar tu token en la app móvil (Settings > Token del Plugin)<br/>
                3. Pegar el token en Settings > Notelert > Plugin Token<br/><br/>
                <em>Nota: Puedes usar Nominatim (gratis) cambiando el proveedor en Settings.</em>
              </div>
            </div>
          `;
          new Notice("🔑 Token del plugin requerido para geocodificación premium");
          return;
        }
      }
      
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

