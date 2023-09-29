import { get_window_scroll_pos } from "../get-window-scroll-pos";

/**
 * Returns the scroll top position of an element
 * @param element DOM element
 */
export const get_scroll_top = (element: HTMLElement | Window): number =>
  element === window
    ? get_window_scroll_pos()
    : (element as HTMLElement).scrollTop -
      (element as HTMLElement).getBoundingClientRect().top;
