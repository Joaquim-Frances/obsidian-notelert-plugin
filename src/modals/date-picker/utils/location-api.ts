/**
 * Utilidades para cargar ubicaciones desde el backend
 */

import { requestUrl } from "obsidian";
import { SavedLocation } from "../../../core/types";
import { PLUGIN_LIST_LOCATIONS_URL } from "../../../core/config";
import { PremiumError, isPremiumError } from "../types";
import { errorToString } from "../../../features/notifications/utils";

export interface LocationLoadResult {
  locations: SavedLocation[];
  error: string | null;
  isPremiumError: boolean;
}

/**
 * Carga las ubicaciones desde el backend
 */
export async function loadLocationsFromBackend(
  token: string | undefined
): Promise<LocationLoadResult> {
  try {
    if (!token?.trim()) {
      return {
        locations: [],
        error: 'TOKEN_REQUIRED',
        isPremiumError: false
      };
    }

    const trimmedToken = token.trim();

    const response = await requestUrl({
      url: PLUGIN_LIST_LOCATIONS_URL,
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-plugin-token": trimmedToken, // Firebase Functions normaliza headers a minúsculas
      },
    });

    if (response.status >= 400) {
      const errorData = (response.json ?? {}) as { error?: string; message?: string; isPremium?: boolean };
      const errorMessage = errorData.message || errorData.error || `HTTP ${response.status}`;
      
      // Si es error 403, probablemente es porque el usuario no es premium
      if (response.status === 403) {
        const premiumError: PremiumError = Object.assign(new Error('PREMIUM_REQUIRED'), {
          status: 403,
          errorData: errorData
        });
        throw premiumError;
      }
      
      throw new Error(errorMessage);
    }

    const data = (response.json ?? {}) as {
      success?: boolean;
      locations?: SavedLocation[];
      count?: number;
      message?: string;
      error?: string;
    };

    if (!data.success) {
      const errorMessage = data.message || data.error || 'Error desconocido al cargar ubicaciones';
      throw new Error(errorMessage);
    }

    const locations = Array.isArray(data.locations) ? data.locations : [];
    
    return {
      locations,
      error: null,
      isPremiumError: false
    };
  } catch (error: unknown) {
    if (isPremiumError(error)) {
      return {
        locations: [],
        error: errorToString(error),
        isPremiumError: true
      };
    }
    
    return {
      locations: [],
      error: errorToString(error),
      isPremiumError: false
    };
  }
}

