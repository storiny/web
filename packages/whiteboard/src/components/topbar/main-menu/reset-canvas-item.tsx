import React from "react";

import { useConfirmation } from "~/components/Confirmation";
import MenuItem from "~/components/MenuItem";
import TrashIcon from "~/icons/Trash";

import { useCanvas } from "../../../hooks";

const ResetCanvasItem = (): React.ReactElement => {
  const canvas = useCanvas();

  /**
   * Resets the canvas
   */
  const resetCanvas = (): void => {
    if (canvas.current) {
      canvas.current.clear();
    }
  };

  const [element] = useConfirmation(
    ({ openConfirmation }) => (
      <MenuItem
        decorator={<TrashIcon />}
        onSelect={(event): void => {
          event.preventDefault(); // Do not auto-close the menu
          openConfirmation();
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
      onConfirm: resetCanvas,
      title: "Reset canvas?",
      description:
        "This will remove all the layers and clear the entire canvas. Are you sure?"
    }
  );

  return element;
};

export default ResetCanvasItem;
