import { Platform } from "obsidian";

/**
 * Detecta si la app de Obsidian está corriendo en iOS
 * @returns true si es iOS, false en caso contrario
 */
export function isIOS(): boolean {
  // Intentar usar Platform.isIOS si está disponible (API de Obsidian)
  if (typeof (Platform as any).isIOS === 'boolean') {
    return (Platform as any).isIOS;
  }
  
  // Fallback: usar navigator.userAgent
  if (typeof navigator !== 'undefined' && navigator.userAgent) {
    const ua = navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(ua) && !(window as any).MSStream;
  }
  
  return false;
}

/**
 * Detecta si la app de Obsidian está corriendo en Android
 * @returns true si es Android, false en caso contrario
 */
export function isAndroid(): boolean {
  // Intentar usar Platform.isAndroid si está disponible (API de Obsidian)
  if (typeof (Platform as any).isAndroid === 'boolean') {
    return (Platform as any).isAndroid;
  }
  
  // Fallback: usar navigator.userAgent
  if (typeof navigator !== 'undefined' && navigator.userAgent) {
    const ua = navigator.userAgent.toLowerCase();
    return /android/.test(ua);
  }
  
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

