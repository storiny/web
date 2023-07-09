import { getWindowScrollPos } from "../getWindowScrollPos";

/**
 * Returns the scroll top position of an element
 * @param element DOM element
 */
export const getScrollTop = (element: HTMLElement | Window): number =>
  element === window
    ? getWindowScrollPos()
    : (element as HTMLElement).scrollTop -
      (element as HTMLElement).getBoundingClientRect().top;
