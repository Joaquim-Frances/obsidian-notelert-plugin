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
  datePickerTrigger: ":@", // Combinación de caracteres para disparar el modal (por defecto :@)
  // Configuración Desktop
  userEmail: "", // Email del usuario (requerido en desktop - DEPRECATED: usar pluginToken)
  userId: "", // ID del usuario de Google (opcional - DEPRECATED: usar pluginToken)
  pluginToken: "", // Token del plugin para autenticación (requerido para premium features)
  scheduledEmails: [], // Lista de emails programados
};

