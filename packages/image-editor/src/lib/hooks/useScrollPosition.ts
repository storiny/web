import { atom, useAtom } from "jotai";
import throttle from "lodash.throttle";
import { useEffect } from "react";

const scrollPositionAtom = atom<number>(0);

export const useScrollPosition = <T extends HTMLLayer>(
  layerRef: React.RefObject<T>
) => {
  const [scrollPosition, setScrollPosition] = useAtom(scrollPositionAtom);

  useEffect(() => {
    const { current: layer } = layerRef;
    if (!layer) {
      return;
    }

    const handleScroll = throttle(() => {
      const { scrollTop } = layer;
      setScrollPosition(scrollTop);
    }, 200);

    layer.addEventListener("scroll", handleScroll);

    return () => {
      handleScroll.cancel();
      layer.removeEventListener("scroll", handleScroll);
    };
  }, [layerRef, setScrollPosition]);

  return scrollPosition;
};
