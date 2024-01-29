import clsx from "clsx";
import React from "react";

import { use_confirmation } from "~/components/confirmation";
import IconButton, { IconButtonProps } from "~/components/icon-button";
import XIcon from "~/icons/x";
import css from "~/theme/main.module.scss";

import { use_whiteboard } from "../../hooks";
import styles from "./topbar.module.scss";

const Cancel = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (props, ref) => {
    const { className, ...rest } = props;
    const { on_cancel } = use_whiteboard();
    const [element] = use_confirmation(
      ({ open_confirmation }) => (
        <IconButton
          {...rest}
          aria-label={"Cancel editing"}
          className={clsx(
            css["focus-invert"],
            styles.x,
            styles["icon-button"],
            className
          )}
          onClick={open_confirmation}
          ref={ref}
          variant={"ghost"}
        >
          <XIcon />
        </IconButton>
      ),
      {
        color: "ruby",
        on_confirm: () => {
          on_cancel?.();
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
  }
);

Cancel.displayName = "Cancel";

export default Cancel;
