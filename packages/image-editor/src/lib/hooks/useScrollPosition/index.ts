import { atom, useAtom } from "jotai";
import throttle from "lodash.throttle";
import React from "react";

const scrollPositionAtom = atom<number>(0);

/**
 * Returns the scroll position
 * @param elementRef Element ref
 */
export const useScrollPosition = <T extends HTMLElement>(
  elementRef: React.RefObject<T>
): number => {
  const [scrollPosition, setScrollPosition] = useAtom(scrollPositionAtom);

  React.useEffect(() => {
    const { current: element } = elementRef;

    if (!element) {
      return;
    }

    const handleScroll = throttle(() => {
      const { scrollTop } = element;
      setScrollPosition(scrollTop);
    }, 200);

    element.addEventListener("scroll", handleScroll);

    return () => {
      handleScroll.cancel();
      element.removeEventListener("scroll", handleScroll);
    };
  }, [elementRef, setScrollPosition]);

  return scrollPosition;
};
