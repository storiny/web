/**
 * Returns the current scroll position in the viewport
 */
export const get_window_scroll_pos = (): number => {
  if (window.scrollY !== undefined) {
    // Modern browser
    return window.scrollY;
  }

  if (
    document.documentElement &&
    document.documentElement.scrollTop !== undefined
  ) {
    // IE
    return document.documentElement.scrollTop;
  }

  return 0;
};
