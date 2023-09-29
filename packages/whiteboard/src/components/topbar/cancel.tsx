import clsx from "clsx";
import React from "react";

import { use_confirmation } from "../../../../ui/src/components/confirmation";
import IconButton from "../../../../ui/src/components/icon-button";
import XIcon from "~/icons/X";

import { useWhiteboard } from "../../hooks";
import styles from "./topbar.module.scss";

const Cancel = (): React.ReactElement => {
  const { on_cancel } = useWhiteboard();
  const [element] = use_confirmation(
    ({ open_confirmation }) => (
      <IconButton
        aria-label={"Cancel editing"}
        className={clsx("focus-invert", styles.x, styles["icon-button"])}
        onClick={open_confirmation}
        variant={"ghost"}
      >
        <XIcon />
      </IconButton>
    ),
    {
      color: "ruby",
      on_confirm: () => {
        if (on_cancel) {
          on_cancel();
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
