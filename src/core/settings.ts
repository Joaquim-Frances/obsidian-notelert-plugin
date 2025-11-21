import { NotelertSettings } from "./types";
import { PLUGIN_GEOCODE_URL } from "./config";

export const DEFAULT_SETTINGS: NotelertSettings = {
  autoProcess: false, // Desactivado - solo a través del date picker
  processOnSave: false, // Desactivado - solo a través del date picker
  processOnOpen: false,
  debugMode: false,
  language: "es", // Spanish as default
  customPatterns: [],
  excludedFolders: ["Templates", "Archive", "Trash"],
  debounceDelay: 3000, // 3 segundos por defecto
  useDebounce: false, // Desactivado - no necesario
  showConfirmationModal: false, // Desactivado por defecto
  addVisualIndicators: false, // Desactivado - usamos feedback visual personalizado
  visualIndicatorIcon: "⏰", // Icono de reloj por defecto
  useNewSyntax: true, // Activar nuevo sistema por defecto
  enableDatePicker: true, // Activar date picker por defecto
  savedLocations: [
    { name: "Casa", latitude: 0, longitude: 0, radius: 100 },
    { name: "Trabajo", latitude: 0, longitude: 0, radius: 100 },
    { name: "Supermercado", latitude: 0, longitude: 0, radius: 200 }
  ], // Ubicaciones favoritas por defecto (solo móvil)
  geocodingProvider: 'google', // Proveedor por defecto: Google Maps (usa proxy por defecto)
  googleMapsApiKey: "", // API key opcional de Google Maps (solo si no se usa proxy)
  useFirebaseProxy: true, // Usar Firebase Functions como proxy (más seguro - por defecto activado)
  firebaseGeocodingUrl: PLUGIN_GEOCODE_URL, // URL de Firebase Function para geocodificación
  mapboxApiKey: "", // API key opcional de Mapbox
  locationiqApiKey: "", // API key opcional de LocationIQ
  opencageApiKey: "", // API key opcional de OpenCage
  algoliaApiKey: "", // API key opcional de Algolia Places
  algoliaAppId: "", // App ID opcional de Algolia Places
  // Configuración Desktop
  userEmail: "", // Email del usuario (requerido en desktop)
  userId: "", // ID del usuario de Google (opcional, para autenticación)
  scheduledEmails: [], // Lista de emails programados
};

