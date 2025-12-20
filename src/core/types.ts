// Interfaces para configuración y detección de patrones
export interface SavedLocation {
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  address?: string;
}

export interface ScheduledEmail {
  notificationId: string;
  title: string;
  message: string;
  scheduledDate: string; // ISO 8601 format
  createdAt: string; // ISO 8601 format
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
  enableDatePicker: boolean; // Activar date picker al escribir el trigger
  datePickerTrigger: string; // Combinación de caracteres para disparar el modal (por defecto :@)
  // Configuración para Desktop (emails)
  userEmail?: string; // Email del usuario para recibir notificaciones (DEPRECATED: usar pluginToken)
  userId?: string; // ID del usuario de Google (DEPRECATED: usar pluginToken)
  pluginToken?: string; // Token del plugin para autenticación (requerido para premium features: geocodificación y emails)
  notelertApiKey?: string; // API Key de Notelert (opcional, solo para cancelar emails - programar usa proxy sin API key)
  scheduledEmails: ScheduledEmail[]; // Lista de emails programados
}

export interface RecurrenceConfig {
  enabled: boolean;
  interval: number; // Cada cuántas unidades se repite
  unit: 'day' | 'week' | 'month' | 'year';
  endType: 'never' | 'count' | 'date';
  endCount?: number; // Número de repeticiones si endType = 'count'
  endDate?: string; // Fecha de fin si endType = 'date' (formato YYYY-MM-DD)
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
  type?: 'time' | 'location'; // Tipo de notificación: tiempo o ubicación
  recurrence?: RecurrenceConfig; // Configuración de recurrencia (solo premium)
}

