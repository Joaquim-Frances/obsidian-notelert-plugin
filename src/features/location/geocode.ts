import { NotelertSettings } from "../../core/types";
import { PLUGIN_GEOCODE_URL } from "../../core/config";

export type GeocodingProvider = 'nominatim' | 'google' | 'mapbox' | 'locationiq' | 'opencage' | 'algolia';

export interface GeocodingResult {
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  displayName: string;
}

export interface GeocodingProviderInterface {
  search(query: string, language: string): Promise<GeocodingResult[]>;
}

// Implementación para Nominatim (OpenStreetMap) - Gratuita
export class NominatimProvider implements GeocodingProviderInterface {
  async search(query: string, language: string): Promise<GeocodingResult[]> {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&extratags=1&accept-language=${language}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Notelert-Obsidian-Plugin/1.0',
        'Accept': 'application/json',
        'Accept-Language': language
      },
      referrerPolicy: 'no-referrer'
    });

    if (!response.ok) {
      throw new Error(`Nominatim error: ${response.status}`);
    }

    const data: unknown = await response.json();
    if (!Array.isArray(data)) return [];

    return data.map((result) => {
      const r = result as {
        address?: {
          road?: string;
          city?: string;
          town?: string;
          village?: string;
        };
        display_name?: string;
        name?: string;
        lat: string;
        lon: string;
      };
      const address = r.address ?? {};
      const shortName =
        address.road ||
        address.city ||
        address.town ||
        address.village ||
        r.display_name?.split(",")[0] ||
        "Ubicación";
      
      return {
        name: shortName,
        latitude: parseFloat(r.lat),
        longitude: parseFloat(r.lon),
        address: r.display_name || r.name || "",
        displayName: r.display_name || r.name || "Ubicación sin nombre"
      };
    });
  }
}

// NOTA: La API Key de Google Maps ya NO está hardcodeada por seguridad.
// El plugin usa el endpoint proxy pluginGeocode que oculta la API key.

// Implementación para Google Maps Geocoding API
export class GoogleMapsProvider implements GeocodingProviderInterface {
  constructor(
    private apiKey: string = "", // Ya no se usa cuando useProxy es true
    private useProxy: boolean = true, // Por defecto usar proxy (más seguro)
    private proxyUrl: string = "",
    private userId?: string,
    private userEmail?: string,
    private pluginToken?: string // Token del plugin para autenticación
  ) {}

  async search(query: string, language: string): Promise<GeocodingResult[]> {
    let url: string;
    let options: RequestInit = {};

    if (this.useProxy && this.proxyUrl) {
      // Usar Firebase Functions como proxy (más seguro - no expone API key)
      if (!this.pluginToken || this.pluginToken.trim() === '') {
        throw new Error('Token del plugin requerido para usar geocodificación premium. Configura tu token en Settings.');
      }
      url = this.proxyUrl;
      options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Plugin-Token': this.pluginToken,
        },
        body: JSON.stringify({
          query,
          language,
        }),
      };
    } else {
      // Llamada directa a Google Maps API (solo si el usuario tiene su propia API key)
      if (!this.apiKey || this.apiKey.trim() === '') {
        throw new Error('Google Maps API key requerida para llamada directa. Usa el proxy de Firebase en su lugar.');
      }
      url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${this.apiKey}&language=${language}`;
    }
    
    const response = await fetch(url, options);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Google Maps error: ${response.status} ${response.statusText} - ${errorData.message || ''}`);
    }

    const data: { features?: unknown[] } = await response.json();
    
    // Manejar respuesta del proxy (formato diferente)
    if (this.useProxy && this.proxyUrl) {
      if (data.status === 'ZERO_RESULTS' || (data.results && data.results.length === 0)) {
        return [];
      }
      
      if (data.status !== 'OK' && data.error) {
        throw new Error(`Geocoding API error: ${data.error} - ${data.message || ''}`);
      }
      
      // El proxy ya devuelve el formato correcto
      return (data.results || []).map((result: {
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
    }
    
    // Manejar respuesta directa de Google Maps API
    if (data.status === 'ZERO_RESULTS') {
      return []; // No hay resultados, pero no es un error
    }
    
    if (data.status !== 'OK') {
      throw new Error(`Google Maps API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
    }
    
    if (!data.results || data.results.length === 0) {
      return [];
    }

    return data.results.slice(0, 5).map((result: {
      address_components?: Array<{ types: string[]; long_name?: string }>;
      formatted_address?: string;
      geometry: { location: { lat: number; lng: number } };
    }) => {
      const components = result.address_components || [];
      const shortName =
        components.find((c) => c.types.includes('route'))?.long_name ||
        components.find((c) => c.types.includes('locality'))?.long_name ||
        result.formatted_address?.split(',')[0] ||
        'Ubicación';
      
      return {
        name: shortName,
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
        address: result.formatted_address,
        displayName: result.formatted_address
      };
    });
  }
}

// Implementación para Mapbox Geocoding API
export class MapboxProvider implements GeocodingProviderInterface {
  constructor(private apiKey: string) {}

  async search(query: string, language: string): Promise<GeocodingResult[]> {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${this.apiKey}&limit=5&language=${language}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Mapbox error: ${response.status}`);
    }

    const data: { status: { code?: number }; results?: unknown[] } = await response.json();
    if (!data.features) return [];

    return data.features.slice(0, 5).map((feature: {
      center: [number, number];
      text?: string;
      place_name?: string;
    }) => {
      const [longitude, latitude] = feature.center;
      const shortName = feature.text || feature.place_name?.split(',')[0] || 'Ubicación';
      
      return {
        name: shortName,
        latitude,
        longitude,
        address: feature.place_name || feature.text || '',
        displayName: feature.place_name || feature.text || 'Ubicación'
      };
    });
  }
}

// Implementación para LocationIQ
export class LocationIQProvider implements GeocodingProviderInterface {
  constructor(private apiKey: string) {}

  async search(query: string, language: string): Promise<GeocodingResult[]> {
    const url = `https://us1.locationiq.com/v1/search.php?key=${this.apiKey}&q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1&accept-language=${language}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`LocationIQ error: ${response.status}`);
    }

    const data: { hits?: unknown[] } = await response.json();
    if (!Array.isArray(data)) return [];

    return data.map((result: {
      address?: { road?: string; city?: string; town?: string; village?: string };
      display_name?: string;
      name?: string;
      lat: string;
      lon: string;
    }) => {
      const address = result.address || {};
      const shortName =
        address.road ||
        address.city ||
        address.town ||
        address.village ||
        result.display_name?.split(',')[0] ||
        'Ubicación';
      
      return {
        name: shortName,
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        address: result.display_name || result.name || '',
        displayName: result.display_name || result.name || 'Ubicación'
      };
    });
  }
}

// Implementación para OpenCage Geocoder
export class OpenCageProvider implements GeocodingProviderInterface {
  constructor(private apiKey: string) {}

  async search(query: string, language: string): Promise<GeocodingResult[]> {
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(query)}&key=${this.apiKey}&limit=5&language=${language}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`OpenCage error: ${response.status}`);
    }

    const data = await response.json();
    if (data.status.code !== 200 || !data.results) return [];

    return data.results.slice(0, 5).map((result: {
      components?: { road?: string; city?: string; town?: string; village?: string };
      formatted?: string;
      geometry: { lat: number; lng: number };
    }) => {
      const components = result.components || {};
      const shortName =
        components.road ||
        components.city ||
        components.town ||
        components.village ||
        result.formatted?.split(',')[0] ||
        'Ubicación';
      
      return {
        name: shortName,
        latitude: result.geometry.lat,
        longitude: result.geometry.lng,
        address: result.formatted || '',
        displayName: result.formatted || 'Ubicación'
      };
    });
  }
}

// Implementación para Algolia Places
export class AlgoliaPlacesProvider implements GeocodingProviderInterface {
  constructor(private apiKey: string, private appId: string) {}

  async search(query: string, language: string): Promise<GeocodingResult[]> {
    const url = `https://places-dsn.algolia.net/1/places/query`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Algolia-Application-Id': this.appId,
        'X-Algolia-API-Key': this.apiKey
      },
      body: JSON.stringify({
        query,
        language,
        hitsPerPage: 5
      })
    });

    if (!response.ok) {
      throw new Error(`Algolia Places error: ${response.status}`);
    }

    const data = await response.json();
    if (!data.hits) return [];

    return data.hits.map((hit: {
      locale_names?: string[];
      name?: string;
      value?: string;
      _geoloc?: { lat?: number; lng?: number };
      latlng?: { lat?: number; lng?: number };
    }) => {
      const shortName = hit.locale_names?.[0] || hit.name || hit.value || 'Ubicación';
      
      return {
        name: shortName,
        latitude: hit._geoloc?.lat || hit.latlng?.lat,
        longitude: hit._geoloc?.lng || hit.latlng?.lng,
        address: hit.value || hit.name || '',
        displayName: hit.value || hit.name || 'Ubicación'
      };
    });
  }
}

// Factory para crear el proveedor correcto
export function createGeocodingProvider(settings: NotelertSettings): GeocodingProviderInterface {
  const provider = settings.geocodingProvider || 'nominatim';
  
  switch (provider) {
    case 'google':
      if (!settings.googleMapsApiKey) {
        throw new Error('Google Maps API key requerida');
      }
      return new GoogleMapsProvider(settings.googleMapsApiKey);
    
    case 'mapbox':
      const mapboxKey = settings.mapboxApiKey;
      if (!mapboxKey) {
        throw new Error('Mapbox API key requerida');
      }
      return new MapboxProvider(mapboxKey);
    
    case 'locationiq':
      const locationiqKey = settings.locationiqApiKey;
      if (!locationiqKey) {
        throw new Error('LocationIQ API key requerida');
      }
      return new LocationIQProvider(locationiqKey);
    
    case 'opencage':
      const opencageKey = settings.opencageApiKey;
      if (!opencageKey) {
        throw new Error('OpenCage API key requerida');
      }
      return new OpenCageProvider(opencageKey);
    
    case 'algolia':
      const algoliaKey = settings.algoliaApiKey;
      const algoliaAppId = settings.algoliaAppId;
      if (!algoliaKey || !algoliaAppId) {
        throw new Error('Algolia API key y App ID requeridos');
      }
      return new AlgoliaPlacesProvider(algoliaKey, algoliaAppId);
    
    case 'nominatim':
    default:
      return new NominatimProvider();
  }
}

// Función principal con fallback automático
export async function searchLocations(
  query: string,
  settings: NotelertSettings,
  language: string,
  log?: (message: string) => void
): Promise<GeocodingResult[]> {
  const configuredProvider = settings.geocodingProvider || 'nominatim';
  log?.(`Proveedor configurado: ${configuredProvider}`);
  
  const providers: GeocodingProvider[] = [
    configuredProvider,
    'nominatim' // Siempre usar Nominatim como fallback
  ].filter((p, i, arr) => arr.indexOf(p) === i) as GeocodingProvider[];

  log?.(`Proveedores a intentar: ${providers.join(', ')}`);

  for (const providerType of providers) {
    try {
      let provider: GeocodingProviderInterface;
      
      switch (providerType) {
        case 'google':
          // Verificar si usar proxy de Firebase (recomendado - más seguro)
          const useProxy = settings.useFirebaseProxy !== false; // Por defecto true
          const proxyUrl = settings.firebaseGeocodingUrl || PLUGIN_GEOCODE_URL;
          
          if (useProxy && proxyUrl) {
            log?.(`Google Maps: Usando proxy Firebase (requiere token del plugin)`);
            // El proxy requiere token del plugin para usuarios premium
            if (!settings.pluginToken || settings.pluginToken.trim() === '') {
              log?.(`Google Maps: Token del plugin no configurado. Usando Nominatim como fallback.`);
              // No lanzar error aquí, solo usar fallback a Nominatim (gratis)
              continue; // Saltar a Nominatim
            }
            provider = new GoogleMapsProvider('', true, proxyUrl, undefined, undefined, settings.pluginToken);
          } else {
            // Solo usar llamada directa si el usuario tiene su propia API key
            const apiKey = settings.googleMapsApiKey?.trim() || '';
            if (!apiKey) {
              log?.(`Google Maps: API key no configurada y proxy no disponible. Usando Nominatim como fallback.`);
              continue; // Saltar a Nominatim
            }
            log?.(`Google Maps: Usando API key del usuario (llamada directa)`);
            provider = new GoogleMapsProvider(apiKey, false);
          }
          break;
        case 'mapbox':
          const mapboxKey = settings.mapboxApiKey;
          if (!mapboxKey || mapboxKey.trim() === '') {
            log?.(`Mapbox: API key no configurada`);
            continue;
          }
          provider = new MapboxProvider(mapboxKey);
          break;
        case 'locationiq':
          const locationiqKey = settings.locationiqApiKey;
          if (!locationiqKey || locationiqKey.trim() === '') {
            log?.(`LocationIQ: API key no configurada`);
            continue;
          }
          provider = new LocationIQProvider(locationiqKey);
          break;
        case 'opencage':
          const opencageKey = settings.opencageApiKey;
          if (!opencageKey || opencageKey.trim() === '') {
            log?.(`OpenCage: API key no configurada`);
            continue;
          }
          provider = new OpenCageProvider(opencageKey);
          break;
        case 'algolia':
          const algoliaKey = settings.algoliaApiKey;
          const algoliaAppId = settings.algoliaAppId;
          if (!algoliaKey || !algoliaAppId || algoliaKey.trim() === '' || algoliaAppId.trim() === '') {
            log?.(`Algolia: API key o App ID no configurados`);
            continue;
          }
          provider = new AlgoliaPlacesProvider(algoliaKey, algoliaAppId);
          break;
        default:
          provider = new NominatimProvider();
      }

      log?.(`Buscando con ${providerType}...`);
      const results = await provider.search(query, language);
      
      if (results.length > 0) {
        log?.(`✅ Encontrados ${results.length} resultados con ${providerType}`);
        return results;
      } else {
        log?.(`⚠️ ${providerType} no devolvió resultados, intentando siguiente proveedor...`);
      }
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      log?.(`❌ Error con ${providerType}: ${errorMsg}`);
      // Continuar con el siguiente proveedor
      continue;
    }
  }

  // Si todos fallan, retornar array vacío
  log?.('❌ Todos los proveedores fallaron');
  return [];
}

