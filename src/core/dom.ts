type ElementCreationOptions = DomElementInfo | string;
type CssPropValue = string | number | null | undefined;
type CssProps = Record<string, CssPropValue>;

export function createDiv(parent: HTMLElement, options?: ElementCreationOptions): HTMLDivElement {
  return parent.createDiv(options);
}

export function createEl<K extends keyof HTMLElementTagNameMap>(
  parent: HTMLElement,
  tag: K,
  options?: ElementCreationOptions
): HTMLElementTagNameMap[K] {
  return parent.createEl(tag, options);
}

export function createSpan(parent: HTMLElement, options?: ElementCreationOptions): HTMLSpanElement {
  return parent.createSpan(options);
}

export function setElementText(element: HTMLElement, text: string): void {
  element.textContent = text;
}

export function getElementText(element: HTMLElement): string {
  return element.textContent || "";
}

export function getElementInt(element: HTMLElement, fallback: number): number {
  const parsed = Number.parseInt(getElementText(element), 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export function setElementId(element: HTMLElement, id: string): void {
  element.id = id;
}

export function setElementClassName(element: HTMLElement, className: string): void {
  element.className = className;
}

export function setButtonDisabled(button: HTMLButtonElement, disabled: boolean): void {
  button.disabled = disabled;
}

export function emptyElement(element: HTMLElement): void {
  element.empty();
}

export function findHTMLElement(parent: HTMLElement, selector: string): HTMLElement | null {
  const element = parent.querySelector(selector);
  return isHTMLElement(element) ? element : null;
}

export function getActiveHTMLElementById(id: string): HTMLElement | null {
  const element = document.getElementById(id);
  return isHTMLElement(element) ? element : null;
}

export function addElementListener<K extends keyof HTMLElementEventMap>(
  element: HTMLElement,
  type: K,
  listener: (event: HTMLElementEventMap[K]) => void
): void {
  element.addEventListener(type, listener);
}

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

export function setCssProps(element: HTMLElement, props: CssProps): void {
  for (const [key, value] of Object.entries(props)) {
    if (value == null) continue;

    const cssValue = typeof value === "number" ? String(value) : value;
    const cssProperty = camelToKebab(key);
    element.style.setProperty(cssProperty, cssValue);
  }
}

/**
 * Interfaz para elementos que tienen propiedades similares a HTMLElement
 * Usado en el fallback cuando HTMLElement no está disponible
 */
interface HTMLElementLike {
  style?: CSSStyleDeclaration;
  offsetWidth?: number;
}

/**
 * Type guard para verificar si un Element es un HTMLElement
 * Versión segura que funciona en todos los contextos de Obsidian
 */
export function isHTMLElement(element: Element | null): element is HTMLElement {
  if (!element) return false;
  // Verificar de forma segura si HTMLElement está disponible
  if (typeof HTMLElement !== 'undefined') {
    return element.instanceOf(HTMLElement);
  }
  // Fallback: verificar propiedades comunes de HTMLElement
  const elementLike = element as Element & HTMLElementLike;
  return (
    element.nodeType === 1 && // ELEMENT_NODE
    typeof elementLike.style !== 'undefined' &&
    typeof elementLike.offsetWidth !== 'undefined'
  );
}
