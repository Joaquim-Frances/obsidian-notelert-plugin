/**
 * Componente para el panel de debug
 */

import { setCssProps } from "../../../core/dom";

export interface DebugPanelResult {
  container: HTMLElement;
  addLog: (message: string) => void;
  clear: () => void;
}

/**
 * Crea el componente de panel de debug
 */
export function createDebugPanel(
  parent: HTMLElement,
  onLog: (message: string) => void
): DebugPanelResult {
  const panelWrapper = parent.createEl("div");
  setCssProps(panelWrapper, {
    marginTop: "15px",
    width: "100%",
    boxSizing: "border-box",
  });
  panelWrapper.id = "debug-panel-container";

  // Título
  const title = panelWrapper.createEl("h3", {
    text: "Logs de Debug",
  });
  setCssProps(title, {
    margin: "0 0 10px 0",
    fontSize: "16px",
    fontWeight: "600",
  });

  const logContainer = panelWrapper.createEl("div");
  setCssProps(logContainer, {
    height: "200px",
    maxHeight: "200px",
    overflowY: "auto",
    overflowX: "hidden",
    padding: "10px",
    margin: "5px 0",
    background: "var(--background-primary)",
    border: "2px solid var(--interactive-accent)",
    borderRadius: "8px",
    boxSizing: "border-box",
    fontFamily: "monospace",
    fontSize: "11px",
  } as Partial<CSSStyleDeclaration>);
  logContainer.id = "debug-log-container";

  const logs: string[] = [];

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    logs.push(logEntry);
    
    // Mantener solo los últimos 50 logs
    if (logs.length > 50) {
      logs.shift();
    }
    
    // Llamar al callback
    onLog(message);
    
    // Actualizar UI
    renderLogs();
  };

  const clear = () => {
    logs.length = 0;
    renderLogs();
  };

  const renderLogs = () => {
    logContainer.empty();
    
    if (logs.length === 0) {
      const emptyEl = logContainer.createEl("div", {
        text: "No hay logs aún. Los logs aparecerán aquí cuando se carguen las ubicaciones.",
      });
      setCssProps(emptyEl, {
        padding: "10px",
        textAlign: "center",
        color: "var(--text-muted)",
        fontSize: "12px",
      });
    } else {
      logs.forEach((log) => {
        const isError = log.includes('Error') || log.includes('FAIL') || log.includes('Fallo') || log.toLowerCase().includes('error');
        const isSuccess = log.includes('SUCCESS') || log.includes('Éxito') || log.includes('OK') || log.toLowerCase().includes('success');
        const isWarning = log.includes('WARNING') || log.includes('Advertencia') || log.includes('Warning') || log.toLowerCase().includes('warning');
        
        const color = isError ? 'var(--text-error)' :
          isSuccess ? 'var(--text-success)' :
          isWarning ? 'var(--text-warning)' :
          'var(--text-normal)';
        const bgColor = isError ? 'rgba(255, 0, 0, 0.1)' :
          isSuccess ? 'rgba(0, 255, 0, 0.1)' : 'transparent';

        const logLine = logContainer.createEl("div");
        setCssProps(logLine, {
          margin: "2px 0",
          padding: "4px 6px",
          color,
          background: bgColor,
          borderLeft: `2px solid ${color}`,
          borderRadius: "2px",
          wordWrap: "break-word",
          whiteSpace: "pre-wrap",
        } as Partial<CSSStyleDeclaration>);
        logLine.textContent = log;
      });
      
      // Auto-scroll al final
      logContainer.scrollTop = logContainer.scrollHeight;
    }
  };

  // Inicializar con mensaje vacío
  renderLogs();

  return {
    container: panelWrapper,
    addLog,
    clear
  };
}

