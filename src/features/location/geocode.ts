import { requestUrl } from "obsidian";
import { NotelertSettings } from "../../core/types";
import { PLUGIN_GEOCODE_URL } from "../../core/config";

export interface GeocodingResult {
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  displayName: string;
}

// Llamada simplificada: SIEMPRE usamos Google Maps vía proxy de Firebase
export async function searchLocations(
  query: string,
  settings: NotelertSettings,
  language: string,
  log?: (message: string) => void
): Promise<GeocodingResult[]> {
  log?.(`Proveedor configurado: Google Maps vía proxy`);

  const proxyUrl = settings.firebaseGeocodingUrl || PLUGIN_GEOCODE_URL;

  if (!settings.pluginToken || settings.pluginToken.trim() === '') {
    throw new Error('Token del plugin requerido para usar geocodificación (Google Maps). Configura tu token en Settings.');
  }

  const response = await requestUrl({
    url: proxyUrl,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Plugin-Token': settings.pluginToken,
    },
    body: JSON.stringify({
      query,
      language,
    }),
  });

  if (response.status >= 400) {
    const errorData = response.json ?? {};
    throw new Error(`Google Maps error: ${response.status} ${response.statusText} - ${errorData.message || ''}`);
  }

  const data: any = response.json;

  if (data.status === 'ZERO_RESULTS' || (data.results && data.results.length === 0)) {
    log?.('⚠️ Google Maps no devolvió resultados');
    return [];
  }

  if (data.status !== 'OK' && data.error) {
    throw new Error(`Geocoding API error: ${data.error} - ${data.message || ''}`);
  }

  const results = (data.results || []).map((result: {
    name: string;
    latitude: number;
    longitude: number;
    address: string;
    displayName: string;
  }) => ({
    name: result.name,
    latitude: result.latitude,
    longitude: result.longitude,
    address: result.address,
    displayName: result.displayName
  }));

  log?.(`✅ Encontrados ${results.length} resultados con Google Maps`);
  return results;
}

