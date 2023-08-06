import React from "react";

import { useConfirmation } from "~/components/Confirmation";
import MenuItem from "~/components/MenuItem";
import TrashIcon from "~/icons/Trash";

import { useCanvas } from "../../../hooks";

const ResetCanvasItem = (): React.ReactElement => {
  const canvas = useCanvas();
  const [element, confirmReset] = useConfirmation(
    <MenuItem
      decorator={<TrashIcon />}
      onSelect={(event): void => {
        event.preventDefault(); // Do not auto-close the menu
        confirmReset({
          color: "ruby",
          slotProps: {
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
        });
      }}
    >
      Reset canvas
    </MenuItem>
  );

  /**
   * Resets the canvas
   */
  const resetCanvas = (): void => {
    if (canvas.current) {
      canvas.current.clear();
    }
  };

  return element;
};

export default ResetCanvasItem;
