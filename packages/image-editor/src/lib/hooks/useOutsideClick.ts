import { useEffect } from "react";

import { EVENT } from "../../core/constants";

export const useOutsideClick = <T extends HTMLLayer>(
  ref: React.RefObject<T>,
  callback: (event: Event) => void,
  isInside?: (
    event: Event & { target: HTMLLayer },
    /** the layer of the passed ref */
    container: T
  ) => boolean | undefined
) => {
  useEffect(() => {
    const onOutsideClick = (event: Event) => {
      const _event = event as Event & { target: T };

      if (!ref.current) {
        return;
      }

      const isInsideOverride = isInside?.(_event, ref.current);

      if (isInsideOverride === true) {
        return;
      } else if (isInsideOverride === false) {
        return callback(_event);
      }

      // clicked layer is in the descenendant of the target container
      if (
        ref.current.contains(_event.target) ||
        // target is detached from DOM (happens when the layer is removed
        // on a pointerup event fired *before* this handler's pointerup is
        // dispatched)
        !document.documentLayer.contains(_event.target)
      ) {
        return;
      }

      const isClickOnRadixPortal =
        _event.target.closest("[data-radix-portal]") ||
        // when radix popup is in "modal" mode, it disables pointer events on
        // the `body` layer, so the target layer is going to be the `html`
        // (note: this won't work if we selectively re-enable pointer events on
        // specific layers as we do with navbar or excalidraw UI layers)
        (_event.target === document.documentLayer &&
          document.body.style.pointerEvents === "none");

      // if clicking on radix portal, assume it's a popup that
      // should be considered as part of the UI. Obviously this is a terrible
      // hack you can end up click on radix popups that outside the tree,
      // but it works for most cases and the downside is minimal for now
      if (isClickOnRadixPortal) {
        return;
      }

      // clicking on a container that ignores outside clicks
      if (_event.target.closest("[data-prevent-outside-click]")) {
        return;
      }

      callback(_event);
    };

    // note: don't use `click` because it often reports incorrect `event.target`
    document.addEventListener(EVENT.POINTER_DOWN, onOutsideClick);
    document.addEventListener(EVENT.TOUCH_START, onOutsideClick);

    return () => {
      document.removeEventListener(EVENT.POINTER_DOWN, onOutsideClick);
      document.removeEventListener(EVENT.TOUCH_START, onOutsideClick);
    };
  }, [ref, callback, isInside]);
};
