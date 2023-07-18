import React from "react";

import { Event as EventEnum } from "../../../constants";

/**
 * Handles clicks outside an element
 * @param ref Ref object
 * @param callback Callback function
 * @param isInside Inside callback
 */
export const useOutsideClick = <T extends HTMLElement>(
  ref: React.RefObject<T>,
  callback: (event: Event) => void,
  isInside?: (
    event: Event & { target: T },
    // The element of the passed ref
    container: T
  ) => boolean | undefined
): void => {
  React.useEffect(() => {
    const onOutsideClick = (event: Event): void => {
      const eventImpl = event as Event & { target: T };

      if (!ref.current) {
        return;
      }

      const isInsideOverride = isInside?.(eventImpl, ref.current);

      if (isInsideOverride === true) {
        return;
      } else if (isInsideOverride === false) {
        return callback(eventImpl);
      }

      // Clicked layer is in the descenendant of the target container
      if (
        ref.current.contains(eventImpl.target) ||
        // Target is detached from DOM (happens when the layer is removed
        // on a `pointerup` event fired before this handler's `pointerup` is
        // dispatched)
        !document.documentElement.contains(eventImpl.target)
      ) {
        return;
      }

      const isClickOnRadixPortal =
        eventImpl.target.closest("[data-radix-portal]") ||
        // When Radix popup is in "modal" mode, it disables pointer events on
        // the `body` element, so the target element is going to be the `html`
        // (note: This won't work if we selectively re-enable pointer events on
        // specific elements)
        (eventImpl.target === document.documentElement &&
          document.body.style.pointerEvents === "none");

      // If clicking on Radix portal, assume it's a popup that
      // should be considered as part of the UI
      if (isClickOnRadixPortal) {
        return;
      }

      // Clicking on a container that ignores outside clicks
      if (eventImpl.target.closest("[data-prevent-outside-click]")) {
        return;
      }

      callback(eventImpl);
    };

    // Note: don't use `click` because it often reports incorrect `event.target`
    document.addEventListener(EventEnum.POINTER_DOWN, onOutsideClick);
    document.addEventListener(EventEnum.TOUCH_START, onOutsideClick);

    return () => {
      document.removeEventListener(EventEnum.POINTER_DOWN, onOutsideClick);
      document.removeEventListener(EventEnum.TOUCH_START, onOutsideClick);
    };
  }, [ref, callback, isInside]);
};
