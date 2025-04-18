/**
 * Tests if an element is of the specified type by comparing its tag name.
 * @param type The type of element to test against.
 * @param element The element to test.
 */
export const test_element_type = (type: string, element: unknown): boolean =>
  type === (element as Element)?.tagName?.toUpperCase?.();

/**
 * Tests if an element is either a `<div>` or `<span>` element.
 * @param element The element to test.
 */
export const test_div = (
  element: unknown
): element is HTMLDivElement | HTMLSpanElement =>
  test_element_type("DIV", element) || test_element_type("SPAN", element);

/**
 * Tests if an element is an `<img>` element.
 * @param element The element to test.
 */
export const test_img = (element: unknown): element is HTMLImageElement =>
  test_element_type("IMG", element);
