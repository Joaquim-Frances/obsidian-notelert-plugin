/**
 * Convierte una propiedad CSS en camelCase a kebab-case
 * Ejemplo: fontSize -> font-size, display -> display (sin cambios)
 */
function camelToKebab(str: string): string {
  // Si ya contiene un guión, no convertir
  if (str.includes('-')) {
    return str;
  }
  // Convertir camelCase a kebab-case
  return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
}

export function setCssProps(element: HTMLElement, props: Partial<CSSStyleDeclaration>): void {
  for (const [key, value] of Object.entries(props)) {
    if (value == null) continue;
    
    // Usar setProperty que es el método estándar y seguro del DOM
    // Convierte camelCase a kebab-case automáticamente
    const cssProperty = camelToKebab(key);
    element.style.setProperty(cssProperty, String(value));
  }
}

/**
 * Type guard para verificar si un Element es un HTMLElement
 */
export function isHTMLElement(element: Element | null): element is HTMLElement {
  return element instanceof HTMLElement;
}


