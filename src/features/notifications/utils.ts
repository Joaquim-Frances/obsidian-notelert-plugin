import { Platform } from "obsidian";

/**
 * Interfaz extendida de Platform que incluye propiedades opcionales
 * que pueden no estar en todas las versiones de Obsidian
 */
interface ExtendedPlatform {
  isMobile: boolean;
  isDesktop: boolean;
  isIOS?: boolean;
  isAndroid?: boolean;
}

/**
 * Detecta si la app de Obsidian está corriendo en iOS
 * @returns true si es iOS, false en caso contrario
 */
export function isIOS(): boolean {
  // Usar Platform.isIOS si está disponible (API de Obsidian)
  const platform = Platform as unknown as ExtendedPlatform;
  if (typeof platform.isIOS === 'boolean') {
    return platform.isIOS;
  }
  
  // Si Platform.isIOS no está disponible, retornar false
  return false;
}

/**
 * Detecta si la app de Obsidian está corriendo en Android
 * @returns true si es Android, false en caso contrario
 */
export function isAndroid(): boolean {
  // Usar Platform.isAndroid si está disponible (API de Obsidian)
  const platform = Platform as unknown as ExtendedPlatform;
  if (typeof platform.isAndroid === 'boolean') {
    return platform.isAndroid;
  }
  
  // Si Platform.isAndroid no está disponible, retornar false
  return false;
}

/**
 * Obtiene información sobre la plataforma móvil
 * @returns 'ios' | 'android' | 'unknown' | 'desktop'
 */
export function getMobilePlatform(): 'ios' | 'android' | 'unknown' | 'desktop' {
  if (!Platform.isMobile) {
    return 'desktop';
  }
  
  if (isIOS()) {
    return 'ios';
  }
  
  if (isAndroid()) {
    return 'android';
  }
  
  return 'unknown';
}

/**
 * Convierte un error desconocido a string de forma segura
 * @param error - El error a convertir
 * @returns String representando el error
 */
export function errorToString(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (typeof error === 'object' && error !== null) {
    try {
      return JSON.stringify(error);
    } catch {
      // Si JSON.stringify falla, intentar obtener información útil del objeto
      const errorObj = error as Record<string, unknown>;
      const keys = Object.keys(errorObj);
      if (keys.length > 0) {
        // Intentar obtener propiedades comunes de error
        const message = errorObj.message || errorObj.error || errorObj.msg;
        if (typeof message === 'string') {
          return message;
        }
        // Si no hay mensaje, retornar información sobre el objeto
        return `Error: ${keys.join(', ')}`;
      }
      return 'Error desconocido';
    }
  }
  
  // Para tipos primitivos (number, boolean, undefined, null, symbol, bigint)
  if (error === null || error === undefined) {
    return 'Error desconocido';
  }
  
  // Verificar que no sea un objeto antes de usar String()
  if (typeof error === 'object') {
    // Si llegamos aquí y es un objeto, intentar una última vez obtener información útil
    try {
      const errorObj = error as Record<string, unknown>;
      const message = errorObj.message || errorObj.error || errorObj.msg;
      if (typeof message === 'string') {
        return message;
      }
      // Si no hay mensaje útil, usar JSON.stringify
      return JSON.stringify(error);
    } catch {
      return 'Error desconocido (no serializable)';
    }
  }
  
  // Para tipos primitivos seguros (number, boolean, symbol, bigint)
  // Verificar explícitamente cada tipo antes de usar String()
  if (typeof error === 'number') {
    return String(error);
  }
  if (typeof error === 'boolean') {
    return String(error);
  }
  if (typeof error === 'symbol') {
    return String(error);
  }
  if (typeof error === 'bigint') {
    return String(error);
  }
  
  // Fallback final: si llegamos aquí, algo inesperado pasó
  return 'Error desconocido';
}

