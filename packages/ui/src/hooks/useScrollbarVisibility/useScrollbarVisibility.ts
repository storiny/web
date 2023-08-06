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

  /**
   * Updates the scrollbar visibility
   */
  const updateVisibility = React.useCallback(() => {
    const { current: container } = containerRef || {};

    if (container) {
      if (container.scrollHeight > container.clientHeight) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    }
  }, []);

  useResizeObserver<T>({
    ref: containerRef,
    onResize: () => requestAnimationFrame(updateVisibility),
    box: "border-box"
  });

  React.useEffect(() => {
    if (containerRef.current) {
      const observer = new MutationObserver(() => updateVisibility());

      observer.observe(containerRef.current, {
        subtree: true,
        childList: true
      });

      return () => {
        observer.disconnect();
      };
    }

    return () => undefined;
  }, [updateVisibility]);

  return { ref: containerRef, visible };
};
