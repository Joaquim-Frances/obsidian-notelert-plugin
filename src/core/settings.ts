import { NotelertSettings } from "./types";

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
  ], // Ubicaciones favoritas por defecto
  googleMapsApiKey: "", // API key opcional
};

