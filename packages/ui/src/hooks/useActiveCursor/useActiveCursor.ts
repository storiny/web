import React from "react";

/**
 * Sets the cursor on the body element when an element gets active
 * @param cursor Active cursor
 */
export const useActiveCursor = (
  cursor: React.CSSProperties["cursor"]
): { onPointerDown: () => void; onPointerUp: () => void } => {
  const onPointerDown = React.useCallback(() => {
    if (cursor) {
      document.body.style.cursor = cursor;
    }
  }, [cursor]);

  const onPointerUp = React.useCallback(() => {
    document.body.style.removeProperty("cursor");
  }, []);

  return { onPointerDown, onPointerUp };
};
