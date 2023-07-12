import React from "react";
import useResizeObserver from "use-resize-observer";

/**
 * Hooks for determining scrollbar visibility inside a container
 */
export const useScrollbarVisibility = <T extends HTMLElement>(): {
  ref: React.RefObject<T>;
  visible: boolean;
} => {
  const containerRef = React.useRef<T>(null);
  const [visible, setVisible] = React.useState<boolean>(false);
  const { ref } = useResizeObserver<T>({
    onResize: () => {
      const { current: container } = containerRef || {};

      if (container) {
        if (container.scrollHeight > container.clientHeight) {
          setVisible(true);
        } else {
          setVisible(false);
        }
      }
    },
    box: "border-box"
  });

  React.useImperativeHandle(ref, () => containerRef.current!);

  return { ref: containerRef, visible };
};
