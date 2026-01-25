import React from "react";
import use_resize_observer from "use-resize-observer";

/**
 * Hook for determining scrollbar visibility inside a container
 * @param initial_value Initial default value
 */
export const use_scrollbar_visibility = <T extends HTMLElement>(
  initial_value?: boolean
): {
  ref: React.RefObject<T>;
  visible: boolean;
} => {
  const container_ref = React.useRef<T>(null);
  const [visible, set_visible] = React.useState<boolean>(
    Boolean(initial_value)
  );

  /**
   * Updates the scrollbar visibility
   */
  const update_visibility = React.useCallback(() => {
    const { current: container } = container_ref || {};
    if (container) {
      set_visible(container.scrollHeight > container.clientHeight);
    }
  }, []);

  use_resize_observer<T>({
    ref: container_ref,

    onResize: () => requestAnimationFrame(update_visibility),
    box: "border-box"
  });

  React.useEffect(() => {
    if (container_ref.current) {
      const observer = new MutationObserver(update_visibility);
      observer.observe(container_ref.current, {
        subtree: true,

        childList: true
      });

      return () => {
        observer.disconnect();
      };
    }

    return () => undefined;
  }, [update_visibility]);

  return { ref: container_ref, visible };
};
