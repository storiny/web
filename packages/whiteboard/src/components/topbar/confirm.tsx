import clsx from "clsx";
import React from "react";

import IconButton from "~/components/icon-button";
import { ModalFooterButton, use_modal } from "~/components/modal";
import { use_toast } from "~/components/toast";
import CheckIcon from "~/icons/check";
import ImageIcon from "~/icons/image";
import css from "~/theme/main.module.scss";

import { use_canvas, use_whiteboard } from "../../hooks";
import ExportImageModal, { ExportHandleRef } from "./export-image-modal";
import styles from "./topbar.module.scss";

const Confirm = (): React.ReactElement => {
  const { on_confirm } = use_whiteboard();
  const canvas = use_canvas();
  const toast = use_toast();
  const [loading, set_loading] = React.useState<boolean>(false);
  const export_ref = React.useRef<ExportHandleRef>(null);
  const [element] = use_modal(
    ({ open_modal }) => (
      <IconButton
        aria-label={"Confirm"}
        className={clsx(css["focus-invert"], styles.x, styles["icon-button"])}
        onClick={(event): void => {
          if (canvas.current) {
            if (canvas.current.getObjects().length) {
              open_modal();
            } else {
              event.preventDefault();
              toast("Cannot continue with an empty canvas", "error");
            }
          }
        }}
      >
        <CheckIcon />
      </IconButton>
    ),
    <ExportImageModal
      is_confirming
      on_export_end={(status, data): void => {
        set_loading(false);

        if (status === "success") {
          if (on_confirm && data) {
            on_confirm(data.file, data.alt);
          }
        } else {
          toast("Unable to export the sketch", "error");
        }
      }}
      on_export_start={(): void => set_loading(true)}
      ref={export_ref}
    />,
    {
      footer: (
        <>
          <ModalFooterButton variant={"ghost"}>Cancel</ModalFooterButton>
          <ModalFooterButton
            loading={loading}
            onClick={(): void => {
              if (export_ref.current) {
                export_ref.current.export();
              }
            }}
          >
            Confirm
          </ModalFooterButton>
        </>
      ),
      slot_props: {
        content: {
          style: {
            zIndex: "calc(var(--z-index-modal) + 2)"
          }
        },
        header: {
          decorator: <ImageIcon />,
          children: "Finish sketch"
        },
        overlay: {
          style: {
            zIndex: "calc(var(--z-index-modal) + 2)"
          }
        }
      }
    }
  );

  return element;
};

export default Confirm;
