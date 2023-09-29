import { get_window_scroll_pos } from "../get-window-scroll-pos";

/**
 * Returns the scroll position of an element
 * @param element DOM element
 */
export const get_scroll_pos = (element: HTMLElement | Window): number =>
  element === window
    ? get_window_scroll_pos()
    : (element as HTMLElement).scrollTop;
