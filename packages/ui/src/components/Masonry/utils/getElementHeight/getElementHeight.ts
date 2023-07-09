/**
 * Returns the height of an element
 * @param element DOM element
 */
export const getElementHeight = (element: HTMLElement | Window): number =>
  element === window
    ? window.innerHeight
    : (element as HTMLElement).clientHeight;
