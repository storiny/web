import React from "react";

/**
 * Sets the cursor on the body element when an element gets active
 * @param cursor Active cursor
 */
export const use_active_cursor = (
  cursor: React.CSSProperties["cursor"]
): { on_pointer_down: () => void; on_pointer_up: () => void } => {
  const on_pointer_down = React.useCallback(() => {
    if (cursor) {
      document.body.style.cursor = cursor;
    }
  }, [cursor]);

  const on_pointer_up = React.useCallback(() => {
    document.body.style.removeProperty("cursor");
  }, []);

  return { on_pointer_down, on_pointer_up };
};
