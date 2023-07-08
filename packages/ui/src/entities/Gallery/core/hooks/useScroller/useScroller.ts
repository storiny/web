import React from "react";

/**
 * Returns the scroll properties of an element
 * @param ref Element ref
 */
export const useScroller = <T extends HTMLElement = HTMLElement>(
  ref: React.MutableRefObject<T | null>
): { isScrolling: boolean; scrollTop: number } => {
  const [isScrolling, setIsScrolling] = React.useState<boolean>(false);
  const [scrollTop, setScrollTop] = React.useState<number>(0);

  React.useLayoutEffect(() => {
    const { current } = ref;
    let tick: number | undefined;

    if (current) {
      const handleScroll = (): void => {
        if (!tick) {
          tick = window.requestAnimationFrame(() => {
            setScrollTop(current.scrollTop);
            tick = void 0;
          });
        }
      };

      current.addEventListener("scroll", handleScroll);

      return () => {
        current.removeEventListener("scroll", handleScroll);

        if (tick) {
          window.cancelAnimationFrame(tick);
        }
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref.current]);

  React.useLayoutEffect(() => {
    setIsScrolling(true);
    const to = window.setTimeout(() => {
      // This is here to prevent premature bail-outs while maintaining high-resolution
      // unsets. Without it, there will always be a lot of unnecessary DOM writes to style
      setIsScrolling(false);
    }, 1000 / 6);

    return () => window.clearTimeout(to);
  }, [scrollTop]);

  return { scrollTop, isScrolling };
};
