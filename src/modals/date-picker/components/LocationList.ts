/**
 * Componente para mostrar y seleccionar ubicaciones guardadas
 */

import { HTMLElement } from "obsidian";
import { SavedLocation } from "../../../core/types";
import { getTranslation } from "../../../i18n";
import { setCssProps, isHTMLElement } from "../../../core/dom";
import { loadLocationsFromBackend } from "../utils/location-api";
import { INotelertPlugin } from "../../../core/plugin-interface";
import { getCachedPremiumStatus } from "../../../features/premium/premium-service";

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
  onDebugLog: (message: string) => void
): Promise<LocationListResult> {
  const listWrapper = parent.createEl("div");
  setCssProps(listWrapper, {
    marginTop: "15px",
    width: "100%",
    boxSizing: "border-box",
  });

  // Título
  const title = listWrapper.createEl("h3", {
    text: getTranslation(language, "datePicker.selectLocationTitle") || "Selecciona una ubicación",
  });
  setCssProps(title, {
    margin: "0 0 10px 0",
    fontSize: "16px",
    fontWeight: "600",
  });

  const listContainer = listWrapper.createEl("div");
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
  } as Partial<CSSStyleDeclaration>);
  listContainer.id = "location-list-container";

  let selectedLocation: SavedLocation | null = null;

  const renderLoading = () => {
    listContainer.empty();
    const loadingContainer = listContainer.createEl("div");
    setCssProps(loadingContainer, {
      padding: "30px 20px",
      textAlign: "center",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "12px",
    });

    const spinner = loadingContainer.createEl("div");
    spinner.createEl("div", { cls: "notelert-spinner" });

    const loadingText = loadingContainer.createEl("div", {
      text: getTranslation(language, "datePicker.loadingLocations") || "Cargando ubicaciones...",
    });
    setCssProps(loadingText, {
      color: "var(--text-muted)",
      fontSize: "13px",
    });
  };

  const renderError = (error: string, isPremium: boolean) => {
    listContainer.empty();
    
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
    const tokenContainer = listContainer.createEl("div");
    setCssProps(tokenContainer, {
      padding: "20px",
      textAlign: "center",
    });

    tokenContainer.createEl("div", { text: "🔑" });
    const icon = tokenContainer.querySelector("div");
    if (icon && isHTMLElement(icon)) {
      setCssProps(icon, {
        fontSize: "32px",
        marginBottom: "12px",
      });
    }

    const tokenTitle = tokenContainer.createEl("div", {
      text: getTranslation(language, "datePicker.tokenRequiredTitle") || "Token del plugin requerido",
    });
    setCssProps(tokenTitle, {
      color: "var(--text-normal)",
      fontSize: "16px",
      fontWeight: "600",
      marginBottom: "8px",
    });

    const tokenDesc = tokenContainer.createEl("div", {
      text: getTranslation(language, "datePicker.tokenRequiredDesc") || 
        "Las notificaciones de ubicación requieren un usuario Premium con token válido.\n\nPara obtener tu token:\n1. Abre la app Notelert en tu móvil\n2. Ve a Settings > Token del Plugin\n3. Copia el token y pégalo en Settings > Notelert > Plugin Token",
    });
    setCssProps(tokenDesc, {
      color: "var(--text-muted)",
      fontSize: "13px",
      lineHeight: "1.6",
      whiteSpace: "pre-line",
      marginBottom: "12px",
    });

    const settingsButton = tokenContainer.createEl("button", {
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
    settingsButton.addEventListener("click", () => {
      const accountLink = "notelert://account";
      try {
        if (typeof window !== 'undefined') {
          window.location.href = accountLink;
          setTimeout(() => {
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
    const premiumContainer = listContainer.createEl("div");
    setCssProps(premiumContainer, {
      padding: "20px",
      textAlign: "center",
    });

    premiumContainer.createEl("div", { text: "💎" });
    const icon = premiumContainer.querySelector("div");
    if (icon && isHTMLElement(icon)) {
      setCssProps(icon, {
        fontSize: "32px",
        marginBottom: "12px",
      });
    }

    const premiumTitle = premiumContainer.createEl("div", {
      text: getTranslation(language, "datePicker.premiumRequiredTitle") || "Plan Premium requerido",
    });
    setCssProps(premiumTitle, {
      color: "var(--text-normal)",
      fontSize: "16px",
      fontWeight: "600",
      marginBottom: "8px",
    });

    const premiumDesc = premiumContainer.createEl("div", {
      text: getTranslation(language, "datePicker.premiumRequiredDesc") || 
        "Las notificaciones de ubicación solo están disponibles en el plan Premium.\n\nActualiza a Premium para usar esta función.",
    });
    setCssProps(premiumDesc, {
      color: "var(--text-muted)",
      fontSize: "13px",
      lineHeight: "1.6",
      whiteSpace: "pre-line",
      marginBottom: "16px",
    });

    const openAppButton = premiumContainer.createEl("button", {
      text: getTranslation(language, "datePicker.openAppToUpgrade") || "Abrir app para actualizar",
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
    openAppButton.addEventListener("click", () => {
      const paywallLink = "notelert://paywall";
      try {
        if (typeof window !== 'undefined') {
          window.location.href = paywallLink;
          setTimeout(() => {
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

    const playStoreButton = premiumContainer.createEl("button", {
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
    playStoreButton.addEventListener("click", () => {
      const playStoreLink = "https://play.google.com/store/apps/details?id=com.quim79.notelert";
      window.open(playStoreLink, "_blank");
    });
  };

  const renderGenericError = (error: string) => {
    const errContainer = listContainer.createEl("div");
    setCssProps(errContainer, {
      padding: "20px",
      textAlign: "center",
    });

    const errTitle = errContainer.createEl("div", {
      text: `${getTranslation(language, "common.error") || "Error"}: ${error}`,
    });
    setCssProps(errTitle, {
      color: "var(--text-error)",
      fontSize: "14px",
      fontWeight: "600",
      marginBottom: "8px",
    });

    const errDesc = errContainer.createEl("div", {
      text: getTranslation(language, "datePicker.locationsErrorDesc") || 
        "Verifica que:\n1. El token sea correcto\n2. Tengas ubicaciones guardadas en la app\n3. Usa el botón 'Ver logs' para más detalles",
    });
    setCssProps(errDesc, {
      color: "var(--text-muted)",
      fontSize: "12px",
      lineHeight: "1.6",
      whiteSpace: "pre-line",
    });
  };

  const renderEmpty = () => {
    listContainer.empty();
    const emptyContainer = listContainer.createEl("div");
    setCssProps(emptyContainer, {
      padding: "20px",
      textAlign: "center",
    });

    emptyContainer.createEl("div", { text: "📍" });
    const icon = emptyContainer.querySelector("div");
    if (icon && isHTMLElement(icon)) {
      setCssProps(icon, {
        fontSize: "32px",
        marginBottom: "12px",
      });
    }

    const emptyTitle = emptyContainer.createEl("div", {
      text: getTranslation(language, "datePicker.noSavedLocationsTitle") || "No hay ubicaciones guardadas",
    });
    setCssProps(emptyTitle, {
      color: "var(--text-normal)",
      fontSize: "15px",
      fontWeight: "600",
      marginBottom: "8px",
    });

    const emptyDesc = emptyContainer.createEl("div", {
      text: getTranslation(language, "datePicker.noSavedLocationsDesc") || 
        "Para crear ubicaciones:\n1. Abre la app Notelert en tu móvil\n2. Ve a Settings > Mis Ubicaciones\n3. Añade ubicaciones desde el mapa\n4. Vuelve aquí y recarga la lista",
    });
    setCssProps(emptyDesc, {
      color: "var(--text-muted)",
      fontSize: "12px",
      lineHeight: "1.6",
      whiteSpace: "pre-line",
      marginBottom: "12px",
    });

    const reloadButton = emptyContainer.createEl("button", {
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
    reloadButton.addEventListener("click", () => {
      void reload();
    });
  };

  const renderLocations = (locations: SavedLocation[]) => {
    listContainer.empty();
    selectedLocation = null;

    locations.forEach((location, index) => {
      const locationItem = listContainer.createEl("div");
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
      locationItem.id = `location-item-${index}`;

      const name = location.name || `Ubicación ${index + 1}`;
      const nameDiv = locationItem.createEl("div", {
        text: name,
      });
      setCssProps(nameDiv, {
        fontWeight: "500",
        fontSize: "14px",
        flex: "1",
      });

      const checkIcon = locationItem.createEl("div", {
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
      checkIcon.id = `check-icon-${index}`;

      const selectLocation = () => {
        locations.forEach((_, idx) => {
          const item = document.getElementById(`location-item-${idx}`);
          const icon = document.getElementById(`check-icon-${idx}`);
          if (item && icon) {
            const firstDiv = item.querySelector('div:first-child');
            setCssProps(item, {
              background: "var(--background-primary)",
              borderColor: "var(--background-modifier-border)",
            });
            if (firstDiv && isHTMLElement(firstDiv)) {
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

      locationItem.addEventListener("click", selectLocation);

      locationItem.addEventListener("mouseenter", () => {
        if (selectedLocation !== location) {
          setCssProps(locationItem, {
            background: "var(--background-modifier-hover)",
            borderColor: "var(--interactive-accent)",
          });
        }
      });

      locationItem.addEventListener("mouseleave", () => {
        if (selectedLocation !== location) {
          setCssProps(locationItem, {
            background: "var(--background-primary)",
            borderColor: "var(--background-modifier-border)",
          });
        }
      });
    });
  };

  const reload = async () => {
    const token = plugin.settings.pluginToken?.trim();
    
    // Verificar premium usando el estado precargado (instantáneo)
    const premiumStatus = getCachedPremiumStatus();
    onDebugLog(`[Ubicaciones] Estado premium precargado: ${premiumStatus.isPremium}`);
    
    // Si no hay token, mostrar error de token requerido
    if (!token) {
      onDebugLog(`[Ubicaciones] Token no configurado`);
      renderError('TOKEN_REQUIRED', false);
      return;
    }
    
    // Si no es premium, mostrar mensaje inmediatamente sin llamar al servidor
    if (!premiumStatus.isPremium && !premiumStatus.loading) {
      onDebugLog(`[Ubicaciones] Usuario no es premium, mostrando mensaje`);
      renderError('PREMIUM_REQUIRED', true);
      return;
    }
    
    renderLoading();
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

