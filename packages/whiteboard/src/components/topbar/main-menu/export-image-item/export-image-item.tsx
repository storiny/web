import React from "react";

import MenuItem from "../../../../../../ui/src/components/menu-item";
import { use_modal } from "../../../../../../ui/src/components/modal";
import ModalFooterButton from "../../../../../../ui/src/components/modal/footer-button";
import { use_toast } from "../../../../../../ui/src/components/toast";
import ImageIcon from "../../../../../../ui/src/icons/image";

import { use_canvas } from "../../../../hooks";
import ExportImageModal, { ExportHandleRef } from "../../export-image-modal";

const ExportImageItem = (): React.ReactElement => {
  const canvas = use_canvas();
  const toast = use_toast();
  const [loading, set_loading] = React.useState<boolean>(false);
  const export_ref = React.useRef<ExportHandleRef>(null);
  const [element] = use_modal(
    ({ open_modal }) => (
      <MenuItem
        decorator={<ImageIcon />}
        onClick={(event: Event): void => {
          if (canvas.current) {
            if (canvas.current.getObjects().length) {
              open_modal();
            } else {
              event.preventDefault();
              toast("Cannot export an empty canvas", "error");
            }
          }
        }}
        onSelect={(event: Event): void => event.preventDefault()}
      >
        Export image…
      </MenuItem>
    ),
    <ExportImageModal
      on_export_end={(status): void => {
        set_loading(false);

        if (status === "fail") {
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
