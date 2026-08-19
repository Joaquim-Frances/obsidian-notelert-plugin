/**
 * Componente para mostrar y seleccionar ubicaciones guardadas
 */

import { SavedLocation } from "../../../core/types";
import { getTranslation } from "../../../i18n";
import { setCssProps, createDiv, createEl, setElementId, emptyElement, findHTMLElement, addElementListener } from "../../../core/dom";
import { loadLocationsFromBackend } from "../utils/location-api";
import { INotelertPlugin } from "../../../core/plugin-interface";

export interface LocationListResult {
  container: HTMLElement;
  selectedLocation: SavedLocation | null;
  reload: () => Promise<void>;
}

/**
 * Crea el componente de lista de ubicaciones
 */
export async function createLocationList(
  parent: HTMLElement,
  language: string,
  plugin: INotelertPlugin,
  onLocationSelect: (location: SavedLocation | null) => void,
  onDebugLog: (message: string) => void,
  onPremiumRequired: () => void
): Promise<LocationListResult> {
  const listWrapper = createDiv(parent);
  setCssProps(listWrapper, {
    marginTop: "15px",
    width: "100%",
    boxSizing: "border-box",
  });

  // Título
  const title = createEl(listWrapper, "h3", {
    text: getTranslation(language, "datePicker.selectLocationTitle"),
  });
  setCssProps(title, {
    margin: "0 0 10px 0",
    fontSize: "16px",
    fontWeight: "600",
  });

  const listContainer = createDiv(listWrapper);
  setCssProps(listContainer, {
    height: "260px",
    maxHeight: "260px",
    overflowY: "auto",
    overflowX: "hidden",
    padding: "10px",
    margin: "5px 0",
    background: "var(--background-primary)",
    border: "2px solid var(--interactive-accent)",
    borderRadius: "8px",
    boxSizing: "border-box",
  });
  setElementId(listContainer, "location-list-container");

  let selectedLocation: SavedLocation | null = null;

  const renderLoading = () => {
    emptyElement(listContainer);
    const loadingContainer = createDiv(listContainer);
    setCssProps(loadingContainer, {
      padding: "30px 20px",
      textAlign: "center",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "12px",
    });

    const spinner = createDiv(loadingContainer);
    createDiv(spinner, { cls: "notelert-spinner" });

    const loadingText = createDiv(loadingContainer, {
      text: getTranslation(language, "datePicker.loadingLocations") || "Cargando ubicaciones...",
    });
    setCssProps(loadingText, {
      color: "var(--text-muted)",
      fontSize: "13px",
    });
  };

  const renderError = (error: string, isPremium: boolean) => {
    emptyElement(listContainer);
    
    if (isPremium) {
      renderPremiumError();
      return;
    }

    if (error === 'TOKEN_REQUIRED') {
      renderTokenRequired();
      return;
    }

    renderGenericError(error);
  };

  const renderTokenRequired = () => {
    const tokenContainer = createDiv(listContainer);
    setCssProps(tokenContainer, {
      padding: "20px",
      textAlign: "center",
    });

    createDiv(tokenContainer, { text: "🔗" });
    const icon = findHTMLElement(tokenContainer, "div");
    if (icon) {
      setCssProps(icon, {
        fontSize: "32px",
        marginBottom: "12px",
      });
    }

    const tokenTitle = createDiv(tokenContainer, {
      text: getTranslation(language, "datePicker.tokenRequiredTitle") || "App link token requerido",
    });
    setCssProps(tokenTitle, {
      color: "var(--text-normal)",
      fontSize: "16px",
      fontWeight: "600",
      marginBottom: "8px",
    });

    const tokenDesc = createDiv(tokenContainer, {
      text: getTranslation(language, "datePicker.tokenRequiredDesc"),
    });
    setCssProps(tokenDesc, {
      color: "var(--text-muted)",
      fontSize: "13px",
      lineHeight: "1.6",
      whiteSpace: "pre-line",
      marginBottom: "12px",
    });

    const settingsButton = createEl(tokenContainer, "button", {
      text: getTranslation(language, "datePicker.openSettings") || "Abrir Settings",
    });
    setCssProps(settingsButton, {
      padding: "10px 20px",
      borderRadius: "6px",
      border: "1px solid var(--interactive-accent)",
      background: "var(--interactive-accent)",
      color: "var(--text-on-accent)",
      fontSize: "14px",
      fontWeight: "500",
      cursor: "pointer",
      width: "100%",
    });
    addElementListener(settingsButton, "click", () => {
      const accountLink = "notelert://account";
      try {
        if (typeof window !== 'undefined') {
          window.location.href = accountLink;
          window.setTimeout(() => {
            const playStoreLink = "https://play.google.com/store/apps/details?id=com.quim79.notelert";
            window.open(playStoreLink, "_blank");
          }, 2000);
        }
      } catch {
        const playStoreLink = "https://play.google.com/store/apps/details?id=com.quim79.notelert";
        if (typeof window !== 'undefined') {
          window.open(playStoreLink, "_blank");
        }
      }
    });
  };

  const renderPremiumError = () => {
    const premiumContainer = createDiv(listContainer);
    setCssProps(premiumContainer, {
      padding: "20px",
      textAlign: "center",
    });

    createDiv(premiumContainer, { text: "💎" });
    const icon = findHTMLElement(premiumContainer, "div");
    if (icon) {
      setCssProps(icon, {
        fontSize: "32px",
        marginBottom: "12px",
      });
    }

    const premiumTitle = createDiv(premiumContainer, {
      text: getTranslation(language, "datePicker.premiumRequiredTitle") || "Plan Premium requerido",
    });
    setCssProps(premiumTitle, {
      color: "var(--text-normal)",
      fontSize: "16px",
      fontWeight: "600",
      marginBottom: "8px",
    });

    const premiumDesc = createDiv(premiumContainer, {
      text: getTranslation(language, "datePicker.premiumRequiredDesc"),
    });
    setCssProps(premiumDesc, {
      color: "var(--text-muted)",
      fontSize: "13px",
      lineHeight: "1.6",
      whiteSpace: "pre-line",
      marginBottom: "16px",
    });

    const openAppButton = createEl(premiumContainer, "button", {
      text: getTranslation(language, "premiumPaywall.premiumTab"),
    });
    setCssProps(openAppButton, {
      padding: "10px 20px",
      borderRadius: "6px",
      border: "1px solid var(--interactive-accent)",
      background: "var(--interactive-accent)",
      color: "var(--text-on-accent)",
      fontSize: "14px",
      fontWeight: "500",
      cursor: "pointer",
      marginBottom: "8px",
      width: "100%",
    });
    addElementListener(openAppButton, "click", onPremiumRequired);

    const playStoreButton = createEl(premiumContainer, "button", {
      text: getTranslation(language, "datePicker.installApp") || "Instalar app desde Play Store",
    });
    setCssProps(playStoreButton, {
      padding: "8px 16px",
      borderRadius: "6px",
      border: "1px solid var(--background-modifier-border)",
      background: "var(--background-primary)",
      color: "var(--text-normal)",
      fontSize: "13px",
      cursor: "pointer",
      width: "100%",
    });
    addElementListener(playStoreButton, "click", () => {
      const playStoreLink = "https://play.google.com/store/apps/details?id=com.quim79.notelert";
      window.open(playStoreLink, "_blank");
    });

    const checkAgainButton = createEl(premiumContainer, "button", {
      text: getTranslation(language, "datePicker.reloadLocations") || "Recargar ubicaciones",
    });
    setCssProps(checkAgainButton, {
      padding: "10px 20px",
      borderRadius: "6px",
      border: "1px solid var(--interactive-accent)",
      background: "var(--interactive-accent)",
      color: "var(--text-on-accent)",
      fontSize: "14px",
      fontWeight: "500",
      cursor: "pointer",
      marginTop: "12px",
      width: "100%",
    });
    addElementListener(checkAgainButton, "click", () => {
      void reload(true);
    });
  };

  const renderGenericError = (error: string) => {
    const errContainer = createDiv(listContainer);
    setCssProps(errContainer, {
      padding: "20px",
      textAlign: "center",
    });

    const errTitle = createDiv(errContainer, {
      text: `${getTranslation(language, "common.error") || "Error"}: ${error}`,
    });
    setCssProps(errTitle, {
      color: "var(--text-error)",
      fontSize: "14px",
      fontWeight: "600",
      marginBottom: "8px",
    });

    const errDesc = createDiv(errContainer, {
      text: getTranslation(language, "datePicker.locationsErrorDesc"),
    });
    setCssProps(errDesc, {
      color: "var(--text-muted)",
      fontSize: "12px",
      lineHeight: "1.6",
      whiteSpace: "pre-line",
    });
  };

  const renderEmpty = () => {
    emptyElement(listContainer);
    const emptyContainer = createDiv(listContainer);
    setCssProps(emptyContainer, {
      padding: "20px",
      textAlign: "center",
    });

    createDiv(emptyContainer, { text: "📍" });
    const icon = findHTMLElement(emptyContainer, "div");
    if (icon) {
      setCssProps(icon, {
        fontSize: "32px",
        marginBottom: "12px",
      });
    }

    const emptyTitle = createDiv(emptyContainer, {
      text: getTranslation(language, "datePicker.noSavedLocationsTitle") || "No hay ubicaciones guardadas",
    });
    setCssProps(emptyTitle, {
      color: "var(--text-normal)",
      fontSize: "15px",
      fontWeight: "600",
      marginBottom: "8px",
    });

    const emptyDesc = createDiv(emptyContainer, {
      text: getTranslation(language, "datePicker.noSavedLocationsDesc"),
    });
    setCssProps(emptyDesc, {
      color: "var(--text-muted)",
      fontSize: "12px",
      lineHeight: "1.6",
      whiteSpace: "pre-line",
      marginBottom: "12px",
    });

    const reloadButton = createEl(emptyContainer, "button", {
      text: getTranslation(language, "datePicker.reloadLocations") || "Recargar ubicaciones",
    });
    setCssProps(reloadButton, {
      padding: "8px 16px",
      borderRadius: "6px",
      border: "1px solid var(--interactive-accent)",
      background: "var(--interactive-accent)",
      color: "var(--text-on-accent)",
      fontSize: "13px",
      cursor: "pointer",
      marginTop: "8px",
    });
    addElementListener(reloadButton, "click", () => {
      void reload();
    });
  };

  const renderLocations = (locations: SavedLocation[]) => {
    emptyElement(listContainer);
    selectedLocation = null;

    locations.forEach((location, index) => {
      const locationItem = createDiv(listContainer);
      setCssProps(locationItem, {
        padding: "12px 15px",
        margin: "8px 0",
        border: "2px solid var(--background-modifier-border)",
        borderRadius: "6px",
        cursor: "pointer",
        transition: "all 0.2s",
        background: "var(--background-primary)",
        width: "100%",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      });
      setElementId(locationItem, `location-item-${index}`);

      const name = location.name || `Ubicación ${index + 1}`;
      const nameDiv = createDiv(locationItem, {
        text: name,
      });
      setCssProps(nameDiv, {
        fontWeight: "500",
        fontSize: "14px",
        flex: "1",
      });

      const checkIcon = createDiv(locationItem, {
        text: "✓",
      });
      setCssProps(checkIcon, {
        fontSize: "18px",
        color: "var(--interactive-accent)",
        fontWeight: "bold",
        opacity: "0",
        transition: "opacity 0.2s",
        marginLeft: "10px",
      });
      setElementId(checkIcon, `check-icon-${index}`);

      const selectLocation = () => {
        locations.forEach((_, idx) => {
          const item = findHTMLElement(listContainer, `#location-item-${idx}`);
          const icon = findHTMLElement(listContainer, `#check-icon-${idx}`);
          if (item && icon) {
            const firstDiv = findHTMLElement(item, 'div:first-child');
            setCssProps(item, {
              background: "var(--background-primary)",
              borderColor: "var(--background-modifier-border)",
            });
            if (firstDiv) {
              setCssProps(firstDiv, { color: "var(--text-normal)" });
            }
            setCssProps(icon, { opacity: "0" });
          }
        });

        setCssProps(locationItem, {
          background: "var(--interactive-accent)",
          borderColor: "var(--interactive-accent)",
        });
        setCssProps(nameDiv, { color: "var(--text-on-accent)" });
        setCssProps(checkIcon, { opacity: "1" });

        selectedLocation = location;
        onLocationSelect(location);
      };

      addElementListener(locationItem, "click", selectLocation);

      addElementListener(locationItem, "mouseenter", () => {
        if (selectedLocation !== location) {
          setCssProps(locationItem, {
            background: "var(--background-modifier-hover)",
            borderColor: "var(--interactive-accent)",
          });
        }
      });

      addElementListener(locationItem, "mouseleave", () => {
        if (selectedLocation !== location) {
          setCssProps(locationItem, {
            background: "var(--background-primary)",
            borderColor: "var(--background-modifier-border)",
          });
        }
      });
    });
  };

  const reload = async (forceRefreshPremium: boolean = false) => {
    const token = plugin.settings.pluginToken?.trim();
    
    // Si no hay token, mostrar error de token requerido
    if (!token) {
      onDebugLog(`[Ubicaciones] Token no configurado`);
      renderError('TOKEN_REQUIRED', false);
      return;
    }
    
    renderLoading();
    onDebugLog(`[Ubicaciones] Iniciando comprobación de estado premium (forceRefresh: ${forceRefreshPremium})`);
    
    const { getPremiumStatus } = await import("../../../features/premium/premium-service");
    const premiumStatus = await getPremiumStatus(token, forceRefreshPremium);
    onDebugLog(`[Ubicaciones] Estado premium obtenido: isPremium=${premiumStatus.isPremium}, loading=${premiumStatus.loading}`);
    
    // Si no es premium, mostrar mensaje
    if (!premiumStatus.isPremium) {
      onDebugLog(`[Ubicaciones] Usuario no es premium, mostrando mensaje`);
      renderError('PREMIUM_REQUIRED', true);
      return;
    }
    
    onDebugLog(`[Ubicaciones] Iniciando carga de ubicaciones`);
    onDebugLog(`[Ubicaciones] Token presente: ${!!token}, Longitud: ${token?.length || 0}`);

    const result = await loadLocationsFromBackend(token);
    
    if (result.error) {
      onDebugLog(`[Ubicaciones] FAIL Error: ${result.error}`);
      renderError(result.error, result.isPremiumError);
      return;
    }

    if (result.locations.length === 0) {
      onDebugLog(`[Ubicaciones] WARNING No hay ubicaciones guardadas`);
      renderEmpty();
      return;
    }

    onDebugLog(`[Ubicaciones] SUCCESS Ubicaciones cargadas: ${result.locations.length}`);
    result.locations.forEach((loc, idx) => {
      onDebugLog(`[Ubicaciones]   ${idx + 1}. ${loc.name} (${loc.latitude}, ${loc.longitude})`);
    });

    renderLocations(result.locations);
  };

  // Cargar inicialmente
  await reload();

  return {
    container: listWrapper,
    selectedLocation,
    reload
  };
}
