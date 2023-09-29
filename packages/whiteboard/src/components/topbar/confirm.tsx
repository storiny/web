import ModalFooterButton from "@storiny/ui/src/components/Modal/FooterButton";
import clsx from "clsx";
import React from "react";

import IconButton from "../../../../ui/src/components/icon-button";
import { use_modal } from "../../../../ui/src/components/modal";
import { use_toast } from "../../../../ui/src/components/toast";
import CheckIcon from "~/icons/Check";
import ImageIcon from "~/icons/Image";

import { useCanvas, useWhiteboard } from "../../hooks";
import ExportImageModal, { ExportHandleRef } from "./export-image-modal";
import styles from "./topbar.module.scss";

const Confirm = (): React.ReactElement => {
  const { on_confirm } = useWhiteboard();
  const canvas = useCanvas();
  const toast = use_toast();
  const [loading, setLoading] = React.useState<boolean>(false);
  const exportRef = React.useRef<ExportHandleRef>(null);
  const [element] = use_modal(
    ({ open_modal }) => (
      <IconButton
        aria-label={"Confirm"}
        className={clsx("focus-invert", styles.x, styles["icon-button"])}
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
      isConfirming
      onExportEnd={(status, data): void => {
        setLoading(false);

        if (status === "success") {
          if (on_confirm && data) {
            on_confirm(data.file, data.alt);
          }
        } else {
          toast("Unable to export the sketch", "error");
        }
      }}
      onExportStart={(): void => setLoading(true)}
      ref={exportRef}
    />,
    {
      footer: (
        <>
          <ModalFooterButton variant={"ghost"}>Cancel</ModalFooterButton>
          <ModalFooterButton
            loading={loading}
            onClick={(): void => {
              if (exportRef.current) {
                exportRef.current.export();
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
