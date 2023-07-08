import React from "react";

/**
 * Observes the size of an element
 * @param ref Element ref
 * @param deps Trigger deps
 */
export const useSize = <T extends HTMLElement = HTMLElement>(
  ref: React.MutableRefObject<T | null>,
  deps: any[] = []
): { height: number; width: number } => {
  const [size, setSize] = React.useState<{ height: number; width: number }>({
    width: 0,
    height: 0
  });

  React.useLayoutEffect(() => {
    const { current } = ref;

    if (current) {
      const handleResize = (): void => {
        const computedStyle = getComputedStyle(current);

        const width =
          current.clientWidth -
          Number.parseFloat(computedStyle.paddingTop) -
          Number.parseFloat(computedStyle.paddingBottom);
        const height =
          current.clientHeight -
          Number.parseFloat(computedStyle.paddingLeft) -
          Number.parseFloat(computedStyle.paddingRight);

        setSize({ height, width });
      };

      handleResize();

      window.addEventListener("resize", handleResize);
      window.addEventListener("orientationchange", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
        window.removeEventListener("orientationchange", handleResize);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps.concat(ref.current));

  return size;
};
