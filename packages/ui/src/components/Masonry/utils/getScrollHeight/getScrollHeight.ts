/**
 * Returns the total scrollable height of an element
 * @param element DOM element
 */
export const getScrollHeight = (element: HTMLElement | Window): number =>
  element === window && document.documentElement
    ? document.documentElement.scrollHeight
    : (element as HTMLElement).scrollHeight;
