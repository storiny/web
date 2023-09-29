import React from "react";

import { use_confirmation } from "../../../../../ui/src/components/confirmation";
import MenuItem from "../../../../../ui/src/components/menu-item";
import TrashIcon from "../../../../../ui/src/icons/trash";

import { use_canvas } from "../../../hooks";

const ResetCanvasItem = (): React.ReactElement => {
  const canvas = use_canvas();

  /**
   * Resets the canvas
   */
  const reset_canvas = (): void => {
    if (canvas.current) {
      canvas.current.clear();
    }
  };

  const [element] = use_confirmation(
    ({ open_confirmation }) => (
      <MenuItem
        decorator={<TrashIcon />}
        onSelect={(event: Event): void => {
          event.preventDefault(); // Do not auto-close the menu
          open_confirmation();
        }}
      >
        Reset canvas
      </MenuItem>
    ),
    {
      color: "ruby",
      slot_props: {
        content: {
          style: {
            zIndex: "calc(var(--z-index-modal) + 2)"
          }
        },
        overlay: {
          style: {
            zIndex: "calc(var(--z-index-modal) + 2)"
          }
        }
      },
      on_confirm: reset_canvas,
      title: "Reset canvas?",
      description:
        "This will remove all the layers and clear the entire canvas. Are you sure?"
    }
  );

  return element;
};

export default ResetCanvasItem;
