import { getWindowScrollPos } from "../getWindowScrollPos";

/**
 * Returns the scroll position of an element
 * @param element DOM element
 */
export const getScrollPos = (element: HTMLElement | Window): number =>
  element === window
    ? getWindowScrollPos()
    : (element as HTMLElement).scrollTop;
