/**
 * Prevents touch scrolling
 */
export const prevent_scroll = (): (() => void) => {
  const handle_touch_move = (event: TouchEvent): void => event.preventDefault();

  window.addEventListener("touchmove", handle_touch_move, {
    passive: false,
    capture: true
  });

  return () => {
    window.removeEventListener("touchmove", handle_touch_move, {
      capture: true
    });
  };
};
