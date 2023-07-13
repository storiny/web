import React from "react";
import useResizeObserver from "use-resize-observer";

/**
 * Hooks for determining scrollbar visibility inside a container
 * @param initialValue Initial default value
 */
export const useScrollbarVisibility = <T extends HTMLElement>(
  initialValue?: boolean
): {
  ref: React.RefObject<T>;
  visible: boolean;
} => {
  const containerRef = React.useRef<T>(null);
  const [visible, setVisible] = React.useState<boolean>(Boolean(initialValue));
  useResizeObserver<T>({
    ref: containerRef,
    onResize: () =>
      requestAnimationFrame(() => {
        const { current: container } = containerRef || {};

        if (container) {
          if (container.scrollHeight > container.clientHeight) {
            setVisible(true);
          } else {
            setVisible(false);
          }
        }
      }),
    box: "border-box"
  });

  return { ref: containerRef, visible };
};
