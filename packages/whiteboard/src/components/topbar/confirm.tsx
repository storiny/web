import ModalFooterButton from "@storiny/ui/src/components/Modal/FooterButton";
import clsx from "clsx";
import React from "react";

import IconButton from "~/components/IconButton";
import { useModal } from "~/components/Modal";
import { useToast } from "~/components/Toast";
import CheckIcon from "~/icons/Check";
import ImageIcon from "~/icons/Image";

import { useCanvas, useWhiteboard } from "../../hooks";
import ExportImageModal, { ExportHandleRef } from "./export-image-modal";
import styles from "./topbar.module.scss";

const Confirm = (): React.ReactElement => {
  const { onConfirm } = useWhiteboard();
  const canvas = useCanvas();
  const toast = useToast();
  const [loading, setLoading] = React.useState<boolean>(false);
  const exportRef = React.useRef<ExportHandleRef>(null);
  const [element] = useModal(
    ({ openModal }) => (
      <IconButton
        aria-label={"Confirm"}
        className={clsx("focus-invert", styles.x, styles["icon-button"])}
        onClick={(event): void => {
          if (canvas.current) {
            if (canvas.current.getObjects().length) {
              openModal();
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
          if (onConfirm && data) {
            onConfirm(data.file, data.alt);
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
