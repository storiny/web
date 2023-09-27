import React from "react";

import MenuItem from "~/components/MenuItem";
import { useModal } from "~/components/Modal";
import ModalFooterButton from "~/components/Modal/FooterButton";
import { useToast } from "~/components/Toast";
import ImageIcon from "~/icons/Image";

import { useCanvas } from "../../../../hooks";
import ExportImageModal, { ExportHandleRef } from "../../export-image-modal";

const ExportImageItem = (): React.ReactElement => {
  const canvas = useCanvas();
  const toast = useToast();
  const [loading, setLoading] = React.useState<boolean>(false);
  const exportRef = React.useRef<ExportHandleRef>(null);
  const [element] = useModal(
    ({ openModal }) => (
      <MenuItem
        decorator={<ImageIcon />}
        onClick={(event): void => {
          if (canvas.current) {
            if (canvas.current.getObjects().length) {
              openModal();
            } else {
              event.preventDefault();
              toast("Cannot export an empty canvas", "error");
            }
          }
        }}
        onSelect={(event): void => event.preventDefault()}
      >
        Export image…
      </MenuItem>
    ),
    <ExportImageModal
      onExportEnd={(status): void => {
        setLoading(false);

        if (status === "fail") {
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
            Export
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
          children: "Export image"
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

export default ExportImageItem;
