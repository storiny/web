import clsx from "clsx";
import React from "react";

import { useConfirmation } from "~/components/Confirmation";
import IconButton from "~/components/IconButton";
import XIcon from "~/icons/X";

import { useWhiteboard } from "../../hooks";
import styles from "./Topbar.module.scss";

const Cancel = (): React.ReactElement => {
  const { onCancel } = useWhiteboard();
  const [element, confirm] = useConfirmation(
    <IconButton
      aria-label={"Cancel editing"}
      className={clsx("focus-invert", styles.x, styles["icon-button"])}
      onClick={(): void => {
        confirm({
          color: "ruby",
          onConfirm: () => {
            if (onCancel) {
              onCancel();
            }
          },
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
          title: "Cancel editing?",
          description:
            "You will lose all the changes made to this canvas. Are you sure?"
        });
      }}
      variant={"ghost"}
    >
      <XIcon />
    </IconButton>
  );

  return element;
};

export default Cancel;
