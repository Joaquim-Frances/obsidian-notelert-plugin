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
    
    // Validar que el valor sea un tipo primitivo válido para CSS
    let cssValue: string;
    if (typeof value === 'string') {
      cssValue = value;
    } else if (typeof value === 'number') {
      cssValue = String(value);
    } else if (typeof value === 'boolean') {
      // Los booleanos no son válidos en CSS, saltar
      continue;
    } else {
      // Si es un objeto u otro tipo, intentar convertirlo de forma segura
      // Primero verificar si es un objeto
      if (typeof value === 'object' && value !== null) {
        // Para objetos, intentar JSON.stringify si es posible
        try {
          const stringified = JSON.stringify(value);
          // Si el resultado es un objeto vacío o no válido para CSS, saltar
          if (stringified === '{}' || stringified.startsWith('{') || stringified.startsWith('[')) {
            continue;
          }
          cssValue = stringified;
        } catch {
          // Si falla la conversión, saltar esta propiedad
          continue;
        }
      } else {
        // Para otros tipos primitivos (symbol, bigint, etc.), verificar explícitamente antes de convertir
        if (typeof value === 'symbol') {
          cssValue = String(value);
        } else if (typeof value === 'bigint') {
          cssValue = String(value);
        } else {
          // Si llegamos aquí y no es un tipo primitivo conocido, saltar
          continue;
        }
      }
    }
    
    // Usar setProperty que es el método estándar y seguro del DOM
    // Convierte camelCase a kebab-case automáticamente
    const cssProperty = camelToKebab(key);
    element.style.setProperty(cssProperty, cssValue);
  }
}

/**
 * Interfaz para elementos que tienen propiedades similares a HTMLElement
 * Usado en el fallback cuando HTMLElement no está disponible
 */
interface HTMLElementLike {
  style?: unknown;
  offsetWidth?: unknown;
}

/**
 * Type guard para verificar si un Element es un HTMLElement
 * Versión segura que funciona en todos los contextos de Obsidian
 */
export function isHTMLElement(element: Element | null): element is HTMLElement {
  if (!element) return false;
  // Verificar de forma segura si HTMLElement está disponible
  if (typeof HTMLElement !== 'undefined') {
    return element instanceof HTMLElement;
  }
  // Fallback: verificar propiedades comunes de HTMLElement
  const elementLike = element as Element & HTMLElementLike;
  return (
    element.nodeType === 1 && // ELEMENT_NODE
    typeof elementLike.style !== 'undefined' &&
    typeof elementLike.offsetWidth !== 'undefined'
  );
}


