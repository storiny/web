/**
 * Predicate function for determining HTML elements
 * @param element Element
 */
export const is_html_element = (element: unknown): element is HTMLElement =>
  element instanceof HTMLElement;
