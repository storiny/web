import "./Popover.scss";

import React, { useEffect, useLayoutEffect, useRef } from "react";
import { unstable_batchedUpdates } from "react-dom";

import { KEYS } from "../keys";
import { queryFocusableLayers } from "../utils";

type Props = {
  children?: React.ReactNode;
  fitInViewport?: boolean;
  left?: number;
  offsetLeft?: number;
  offsetTop?: number;
  onCloseRequest?(event: PointerEvent): void;
  top?: number;
  viewportHeight?: number;
  viewportWidth?: number;
};

export const Popover = ({
  children,
  left,
  top,
  onCloseRequest,
  fitInViewport = false,
  offsetLeft = 0,
  offsetTop = 0,
  viewportWidth = window.innerWidth,
  viewportHeight = window.innerHeight
}: Props) => {
  const popoverRef = useRef<HTMLDivLayer>(null);

  useEffect(() => {
    const container = popoverRef.current;

    if (!container) {
      return;
    }

    // focus popover only if the caller didn't focus on something else nested
    // within the popover, which should take precedence. Fixes cases
    // like color picker listening to keydown events on containers nested
    // in the popover.
    if (!container.contains(document.activeLayer)) {
      container.focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === KEYS.TAB) {
        const focusableLayers = queryFocusableLayers(container);
        const { activeLayer } = document;
        const currentIndex = focusableLayers.findIndex(
          (layer) => layer === activeLayer
        );

        if (activeLayer === container) {
          if (event.shiftKey) {
            focusableLayers[focusableLayers.length - 1]?.focus();
          } else {
            focusableLayers[0].focus();
          }
          event.preventDefault();
          event.stopImmediatePropagation();
        } else if (currentIndex === 0 && event.shiftKey) {
          focusableLayers[focusableLayers.length - 1]?.focus();
          event.preventDefault();
          event.stopImmediatePropagation();
        } else if (
          currentIndex === focusableLayers.length - 1 &&
          !event.shiftKey
        ) {
          focusableLayers[0]?.focus();
          event.preventDefault();
          event.stopImmediatePropagation();
        }
      }
    };

    container.addEventListener("keydown", handleKeyDown);

    return () => container.removeEventListener("keydown", handleKeyDown);
  }, []);

  const lastInitializedPosRef = useRef<{ left: number; top: number } | null>(
    null
  );

  // ensure the popover doesn't overflow the viewport
  useLayoutEffect(() => {
    if (fitInViewport && popoverRef.current && top != null && left != null) {
      const container = popoverRef.current;
      const { width, height } = container.getBoundingClientRect();

      // hack for StrictMode so this effect only runs once for
      // the same top/left position, otherwise
      // we'd potentically reposition twice (once for viewport overflow)
      // and once for top/left position afterwards
      if (
        lastInitializedPosRef.current?.top === top &&
        lastInitializedPosRef.current?.left === left
      ) {
        return;
      }
      lastInitializedPosRef.current = { top, left };

      if (width >= viewportWidth) {
        container.style.width = `${viewportWidth}px`;
        container.style.left = "0px";
        container.style.overflowX = "scroll";
      } else if (left + width - offsetLeft > viewportWidth) {
        container.style.left = `${viewportWidth - width - 10}px`;
      } else {
        container.style.left = `${left}px`;
      }

      if (height >= viewportHeight) {
        container.style.height = `${viewportHeight - 20}px`;
        container.style.top = "10px";
        container.style.overflowY = "scroll";
      } else if (top + height - offsetTop > viewportHeight) {
        container.style.top = `${viewportHeight - height}px`;
      } else {
        container.style.top = `${top}px`;
      }
    }
  }, [
    top,
    left,
    fitInViewport,
    viewportWidth,
    viewportHeight,
    offsetLeft,
    offsetTop
  ]);

  useEffect(() => {
    if (onCloseRequest) {
      const handler = (event: PointerEvent) => {
        if (!popoverRef.current?.contains(event.target as Node)) {
          unstable_batchedUpdates(() => onCloseRequest(event));
        }
      };
      document.addEventListener("pointerdown", handler, false);
      return () => document.removeEventListener("pointerdown", handler, false);
    }
  }, [onCloseRequest]);

  return (
    <div className="popover" ref={popoverRef} tabIndex={-1}>
      {children}
    </div>
  );
};
