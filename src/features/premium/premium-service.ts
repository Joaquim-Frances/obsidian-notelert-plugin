/**
 * Servicio para verificar el estado premium del usuario
 * 
 * El estado se precarga al iniciar el plugin y se mantiene en memoria.
 * Así el modal se abre instantáneamente sin esperar la verificación.
 */

import { requestUrl } from "obsidian";

const FIREBASE_FUNCTION_BASE_URL = 'https://us-central1-notalert-2a44a.cloudfunctions.net';
// Endpoint dedicado para verificar premium sin bloquear otras funcionalidades
const PLUGIN_GET_PREMIUM_STATUS_URL = `${FIREBASE_FUNCTION_BASE_URL}/pluginGetPremiumStatus`;

export interface PremiumStatus {
  isPremium: boolean;
  expiresAt?: Date;
  cached?: boolean;
  loading?: boolean;
}

// Estado premium precargado
let cachedStatus: PremiumStatus = { isPremium: false, loading: true };
let cacheTimestamp: number = 0;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutos

// Callbacks para notificar cambios de estado
type PremiumChangeCallback = (status: PremiumStatus) => void;
const changeCallbacks: PremiumChangeCallback[] = [];

/**
 * Registra un callback para ser notificado cuando cambie el estado premium
 */
export function onPremiumStatusChange(callback: PremiumChangeCallback): () => void {
  changeCallbacks.push(callback);
  // Retorna función para desregistrar
  return () => {
    const index = changeCallbacks.indexOf(callback);
    if (index > -1) {
      changeCallbacks.splice(index, 1);
    }
  };
}

/**
 * Notifica a todos los callbacks registrados
 */
function notifyStatusChange(status: PremiumStatus) {
  changeCallbacks.forEach(cb => {
    try {
      cb(status);
    } catch (e) {
      console.error('[PremiumService] Error en callback:', e);
    }
  });
}

/**
 * Obtiene el estado premium cacheado (síncrono, instantáneo)
 */
export function getCachedPremiumStatus(): PremiumStatus {
  return { ...cachedStatus };
}

/**
 * Precarga el estado premium en segundo plano.
 * Llamar al iniciar el plugin.
 */
export async function preloadPremiumStatus(pluginToken: string | undefined): Promise<void> {
  const trimmedToken = pluginToken?.trim();
  if (!trimmedToken) {
    console.debug('[PremiumService] No hay token para precargar');
    cachedStatus = { isPremium: false, loading: false };
    return;
  }
  
  // Validar formato del token antes de hacer la llamada
  if (trimmedToken.length !== 64) {
    console.warn(`[PremiumService] Token con longitud incorrecta: ${trimmedToken.length}, esperado: 64. No se precargará el estado premium.`);
    cachedStatus = { isPremium: false, loading: false };
    return;
  }
  
  console.debug('[PremiumService] Precargando estado premium...');
  await fetchPremiumStatus(trimmedToken, true);
}

/**
 * Obtiene el estado premium del usuario
 * @param pluginToken Token del plugin (64 caracteres hex)
 * @param forceRefresh Forzar actualización ignorando cache
 */
export async function getPremiumStatus(
  pluginToken: string | undefined,
  forceRefresh: boolean = false
): Promise<PremiumStatus> {
  // Si no hay token, no es premium
  if (!pluginToken?.trim()) {
    return { isPremium: false, loading: false };
  }

  // Si no forzamos refresh y tenemos cache válido, usarlo
  const now = Date.now();
  if (!forceRefresh && !cachedStatus.loading && (now - cacheTimestamp) < CACHE_DURATION_MS) {
    return { ...cachedStatus, cached: true };
  }

  return fetchPremiumStatus(pluginToken, forceRefresh);
}

/**
 * Hace la llamada real al servidor para verificar premium
 */
async function fetchPremiumStatus(
  pluginToken: string,
  _forceRefresh: boolean
): Promise<PremiumStatus> {
  const cleanToken = pluginToken.trim();
  const now = Date.now();
  
  // Verificar formato del token (64 caracteres hex)
  if (cleanToken.length !== 64) {
    console.warn(`[PremiumService] Token con longitud incorrecta: ${cleanToken.length}, esperado: 64`);
    cachedStatus = { isPremium: false, loading: false };
    return cachedStatus;
  }

  try {
    // Log sanitizado para debugging
    console.debug(`[PremiumService] Llamando a ${PLUGIN_GET_PREMIUM_STATUS_URL}`, {
      tokenLength: cleanToken.length,
      tokenPreview: `${cleanToken.substring(0, 4)}...${cleanToken.substring(cleanToken.length - 4)}`
    });

    const response = await requestUrl({
      url: PLUGIN_GET_PREMIUM_STATUS_URL,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-plugin-token': cleanToken, // Firebase Functions normaliza headers a minúsculas
      },
    });

    console.debug(`[PremiumService] Respuesta recibida: status=${response.status}`);

    // Parsear respuesta
    const data = response.json as { isPremium?: boolean; expiresAt?: string; error?: string };
    
    if (response.status === 200) {
      const isPremium = data.isPremium === true;
      const status: PremiumStatus = { 
        isPremium, 
        loading: false,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      };
      
      console.debug(`[PremiumService] ${isPremium ? '✅ Usuario ES premium' : '❌ Usuario NO es premium'}`);
      
      cachedStatus = status;
      cacheTimestamp = now;
      notifyStatusChange(status);
      
      return status;
    }
    
    // Error 401 = token inválido, pero no bloquea
    if (response.status === 401) {
      console.warn('[PremiumService] ⚠️ Token inválido');
      const status: PremiumStatus = { isPremium: false, loading: false };
      cachedStatus = status;
      cacheTimestamp = now;
      return status;
    }

    // Otros errores
    console.error('[PremiumService] Error inesperado:', response.status);
    cachedStatus = { isPremium: false, loading: false };
    return cachedStatus;
    
  } catch (error: unknown) {
    // Manejar errores de red o HTTP
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Si es un error 401, manejarlo como token inválido (no es un error crítico)
    if (errorMessage.includes('401') || errorMessage.includes('status 401')) {
      console.warn('[PremiumService] ⚠️ Token inválido o no autorizado (401). Verifica que el token sea correcto.');
      const status: PremiumStatus = { isPremium: false, loading: false };
      cachedStatus = status;
      cacheTimestamp = now;
      return status;
    }
    
    // Otros errores (red, timeout, etc.)
    console.error('[PremiumService] Error fetching premium status:', error);
    
    // En caso de error de red, mantener cache si existe y no está en loading
    if (!cachedStatus.loading) {
      console.debug('[PremiumService] Usando cache por error de red');
      return { ...cachedStatus, cached: true };
    }
    
    cachedStatus = { isPremium: false, loading: false };
    return cachedStatus;
  }
}

/**
 * Invalida el cache del estado premium
 */
export function invalidatePremiumCache(): void {
  cachedStatus = { isPremium: false, loading: true };
  cacheTimestamp = 0;
}

/**
 * Verifica si el usuario es premium (versión síncrona usando cache)
 * Devuelve false si no hay cache válido
 */
export function isPremiumCached(): boolean {
  if (cachedStatus.loading) return false;
  const now = Date.now();
  if ((now - cacheTimestamp) >= CACHE_DURATION_MS) return false;
  return cachedStatus.isPremium;
}
