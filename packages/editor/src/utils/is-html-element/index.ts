/**
 * Predicate function for determining HTML elements
 * @param element Element
 */
export const isHTMLElement = (element: unknown): element is HTMLElement =>
  element instanceof HTMLElement;
