/**
 * Tests if an image element has finished loading.
 * @param element The image element to test.
 */
export const test_img_loaded = (element: HTMLImageElement): boolean =>
  element.complete && element.naturalHeight !== 0;
