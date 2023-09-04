import { useSetAtom } from "jotai";
import { RefObject, useEffect } from "react";

import { figureOffsetsAtom } from "../../atoms";

export const useIntersectionObserver = (
  elementRef: RefObject<Element>,
  nodeKey: string,
  { threshold = 0, root = null, rootMargin = "0%" } = {}
): void => {
  const setOffsetsMap = useSetAtom(figureOffsetsAtom);

  useEffect(() => {
    const onScroll = (): void => {
      setOffsetsMap((prev) => {
        for (const [key, [element]] of Object.entries(prev)) {
          prev[key][1] = element.getBoundingClientRect().top;
        }

        return { ...prev };
      });
    };

    window.addEventListener("scroll", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, [setOffsetsMap]);

  useEffect(() => {
    const node = elementRef?.current; // DOM Ref
    const hasIOSupport = !!window.IntersectionObserver;

    if (!hasIOSupport || !node) {
      return;
    }

    const observerParams = { threshold, root, rootMargin };
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const targetKey = entry.target.getAttribute("data-key");

        if (targetKey) {
          if (entry.isIntersecting) {
            setOffsetsMap((prev) => {
              prev[targetKey] = [
                entry.target,
                entry.target.getBoundingClientRect().top
              ];

              return { ...prev };
            });
          } else {
            setOffsetsMap((prev) => {
              delete prev[targetKey];
              return { ...prev };
            });
          }
        }
      }
    }, observerParams);

    node.setAttribute("data-key", nodeKey);
    observer.observe(node);

    return () => {
      setOffsetsMap((prev) => {
        delete prev[nodeKey];
        return prev;
      });
      observer.disconnect();
    };
  }, [threshold, setOffsetsMap, root, rootMargin, elementRef, nodeKey]);
};
