/**
 * Prevents touch scrolling
 */
export const preventScroll = (): (() => void) => {
  const handleTouchMove = (event: TouchEvent): void => {
    event.preventDefault();
  };

  window.addEventListener("touchmove", handleTouchMove, {
    passive: false,
    capture: true
  });

  return () => {
    window.removeEventListener("touchmove", handleTouchMove, { capture: true });
  };
};
