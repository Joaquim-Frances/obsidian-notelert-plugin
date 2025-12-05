export function setCssProps(element: HTMLElement, props: Partial<CSSStyleDeclaration>): void {
  for (const [key, value] of Object.entries(props)) {
    if (value == null) continue;
    (element.style as any)[key] = value;
  }
}

/**
 * Type guard para verificar si un Element es un HTMLElement
 */
export function isHTMLElement(element: Element | null): element is HTMLElement {
  return element instanceof HTMLElement;
}


