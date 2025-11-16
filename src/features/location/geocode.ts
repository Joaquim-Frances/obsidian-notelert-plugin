import { NotelertSettings } from "../../core/types";

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

    const data = await response.json();
    if (!Array.isArray(data)) return [];

    return data.map((result: any) => {
      const address = result.address || {};
      const shortName = address.road || address.city || address.town || address.village || result.display_name?.split(',')[0] || 'Ubicación';
      
      return {
        name: shortName,
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        address: result.display_name || result.name || '',
        displayName: result.display_name || result.name || 'Ubicación sin nombre'
      };
    });
  }
}

// API Key por defecto del plugin (puede ser sobrescrita por el usuario)
const DEFAULT_GOOGLE_MAPS_API_KEY = "AIzaSyBwR-GmihN8Xic-npwi6p4wTUwJ67ueWvk";

// Implementación para Google Maps Geocoding API
export class GoogleMapsProvider implements GeocodingProviderInterface {
  constructor(
    private apiKey: string,
    private useProxy: boolean = false,
    private proxyUrl: string = ""
  ) {}

  async search(query: string, language: string): Promise<GeocodingResult[]> {
    let url: string;
    let options: RequestInit = {};

    if (this.useProxy && this.proxyUrl) {
      // Usar Firebase Functions como proxy
      url = `${this.proxyUrl}?query=${encodeURIComponent(query)}&language=${language}`;
    } else {
      // Llamada directa a Google Maps API
      url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${this.apiKey}&language=${language}`;
    }
    
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`Google Maps error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Manejar diferentes estados de respuesta de Google Maps
    if (data.status === 'ZERO_RESULTS') {
      return []; // No hay resultados, pero no es un error
    }
    
    if (data.status !== 'OK') {
      throw new Error(`Google Maps API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
    }
    
    if (!data.results || data.results.length === 0) {
      return [];
    }

    return data.results.slice(0, 5).map((result: any) => {
      const components = result.address_components || [];
      const shortName = components.find((c: any) => c.types.includes('route'))?.long_name ||
                       components.find((c: any) => c.types.includes('locality'))?.long_name ||
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

    const data = await response.json();
    if (!data.features) return [];

    return data.features.slice(0, 5).map((feature: any) => {
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

    const data = await response.json();
    if (!Array.isArray(data)) return [];

    return data.map((result: any) => {
      const address = result.address || {};
      const shortName = address.road || address.city || address.town || address.village || result.display_name?.split(',')[0] || 'Ubicación';
      
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

    return data.results.slice(0, 5).map((result: any) => {
      const components = result.components || {};
      const shortName = components.road || components.city || components.town || components.village || result.formatted?.split(',')[0] || 'Ubicación';
      
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

    return data.hits.map((hit: any) => {
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
  const provider = (settings as any).geocodingProvider || 'nominatim';
  
  switch (provider) {
    case 'google':
      if (!settings.googleMapsApiKey) {
        throw new Error('Google Maps API key requerida');
      }
      return new GoogleMapsProvider(settings.googleMapsApiKey);
    
    case 'mapbox':
      const mapboxKey = (settings as any).mapboxApiKey;
      if (!mapboxKey) {
        throw new Error('Mapbox API key requerida');
      }
      return new MapboxProvider(mapboxKey);
    
    case 'locationiq':
      const locationiqKey = (settings as any).locationiqApiKey;
      if (!locationiqKey) {
        throw new Error('LocationIQ API key requerida');
      }
      return new LocationIQProvider(locationiqKey);
    
    case 'opencage':
      const opencageKey = (settings as any).opencageApiKey;
      if (!opencageKey) {
        throw new Error('OpenCage API key requerida');
      }
      return new OpenCageProvider(opencageKey);
    
    case 'algolia':
      const algoliaKey = (settings as any).algoliaApiKey;
      const algoliaAppId = (settings as any).algoliaAppId;
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
  const configuredProvider = (settings as any).geocodingProvider || 'nominatim';
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
          // Determinar qué API key usar: la del usuario o la por defecto del plugin
          const apiKey = (settings.googleMapsApiKey && settings.googleMapsApiKey.trim() !== '') 
            ? settings.googleMapsApiKey 
            : DEFAULT_GOOGLE_MAPS_API_KEY;
          
          if (!apiKey || apiKey.trim() === '') {
            log?.(`Google Maps: API key no configurada (ni usuario ni plugin)`);
            continue;
          }
          
          // Verificar si usar proxy de Firebase
          const useProxy = (settings as any).useFirebaseProxy || false;
          const proxyUrl = (settings as any).firebaseGeocodingUrl || '';
          
          if (useProxy && proxyUrl) {
            log?.(`Google Maps: Usando proxy Firebase`);
            provider = new GoogleMapsProvider(apiKey, true, proxyUrl);
          } else {
            log?.(`Google Maps: API key encontrada (${apiKey.substring(0, 10)}...)`);
            provider = new GoogleMapsProvider(apiKey, false);
          }
          break;
        case 'mapbox':
          const mapboxKey = (settings as any).mapboxApiKey;
          if (!mapboxKey || mapboxKey.trim() === '') {
            log?.(`Mapbox: API key no configurada`);
            continue;
          }
          provider = new MapboxProvider(mapboxKey);
          break;
        case 'locationiq':
          const locationiqKey = (settings as any).locationiqApiKey;
          if (!locationiqKey || locationiqKey.trim() === '') {
            log?.(`LocationIQ: API key no configurada`);
            continue;
          }
          provider = new LocationIQProvider(locationiqKey);
          break;
        case 'opencage':
          const opencageKey = (settings as any).opencageApiKey;
          if (!opencageKey || opencageKey.trim() === '') {
            log?.(`OpenCage: API key no configurada`);
            continue;
          }
          provider = new OpenCageProvider(opencageKey);
          break;
        case 'algolia':
          const algoliaKey = (settings as any).algoliaApiKey;
          const algoliaAppId = (settings as any).algoliaAppId;
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
    } catch (error: any) {
      const errorMsg = error?.message || String(error);
      log?.(`❌ Error con ${providerType}: ${errorMsg}`);
      // Continuar con el siguiente proveedor
      continue;
    }
  }

  // Si todos fallan, retornar array vacío
  log?.('❌ Todos los proveedores fallaron');
  return [];
}

