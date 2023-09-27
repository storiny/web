import clsx from "clsx";
import React from "react";

import { useConfirmation } from "~/components/Confirmation";
import IconButton from "~/components/IconButton";
import XIcon from "~/icons/X";

import { useWhiteboard } from "../../hooks";
import styles from "./topbar.module.scss";

const Cancel = (): React.ReactElement => {
  const { onCancel } = useWhiteboard();
  const [element] = useConfirmation(
    ({ openConfirmation }) => (
      <IconButton
        aria-label={"Cancel editing"}
        className={clsx("focus-invert", styles.x, styles["icon-button"])}
        onClick={openConfirmation}
        variant={"ghost"}
      >
        <XIcon />
      </IconButton>
    ),
    {
      color: "ruby",
      onConfirm: () => {
        if (onCancel) {
          onCancel();
        }
      },
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
      title: "Cancel editing?",
      description:
        "You will lose all the changes made to this canvas. Are you sure?"
    }
  );

  return element;
};

export default Cancel;
