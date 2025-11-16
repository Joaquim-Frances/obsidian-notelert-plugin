// Interfaces para configuración y detección de patrones
export interface SavedLocation {
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  address?: string;
}

export interface NotelertSettings {
  autoProcess: boolean;
  processOnSave: boolean;
  processOnOpen: boolean;
  debugMode: boolean;
  language: string;
  customPatterns: string[];
  excludedFolders: string[];
  debounceDelay: number; // Tiempo de espera en milisegundos
  useDebounce: boolean; // Activar/desactivar el sistema de debounce
  showConfirmationModal: boolean; // Mostrar modal de confirmación antes de crear notificaciones
  addVisualIndicators: boolean; // Añadir iconos visuales a recordatorios procesados
  visualIndicatorIcon: string; // Icono a usar para indicar recordatorios procesados
  useNewSyntax: boolean; // Usar nuevo sistema de sintaxis {@fecha, hora}
  enableDatePicker: boolean; // Activar date picker al escribir {@
  savedLocations: SavedLocation[]; // Ubicaciones favoritas guardadas
  googleMapsApiKey?: string; // API key de Google Maps (opcional, para mejor funcionalidad)
}

export interface DetectedPattern {
  text: string;
  title: string;
  message: string;
  date: string;
  time: string;
  fullMatch: string;
  startIndex: number;
  endIndex: number;
  filePath?: string; // Ruta del archivo donde se detectó el patrón
  lineNumber?: number; // Número de línea donde se detectó el patrón
  location?: string; // Nombre de la ubicación
  latitude?: number; // Latitud de la ubicación
  longitude?: number; // Longitud de la ubicación
  radius?: number; // Radio en metros para la geofence
}

