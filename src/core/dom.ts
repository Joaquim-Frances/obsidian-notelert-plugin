export function setCssProps(element: HTMLElement, props: Partial<CSSStyleDeclaration>): void {
  for (const [key, value] of Object.entries(props)) {
    if (value == null) continue;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (element.style as any)[key] = value;
  }
}


