import React from "react";
import { useFilePicker } from "use-file-picker";

import { useConfirmation } from "~/components/Confirmation";
import MenuItem from "~/components/MenuItem";
import { useToast } from "~/components/Toast";
import FolderOpenIcon from "~/icons/FolderOpen";

import { FILE_EXTENSIONS } from "../../../constants";
import { useCanvas } from "../../../hooks";
import { importFromFile } from "../../../utils";

const ImportItem = (): React.ReactElement => {
  const canvas = useCanvas();
  const toast = useToast();
  const [openFileSelector] = useFilePicker({
    readAs: "ArrayBuffer",
    accept: FILE_EXTENSIONS.map((ext) => `.${ext}`),
    multiple: false,
    limitFilesConfig: { max: 1, min: 1 },
    onFilesRejected: () => {
      toast("Unable to import the sketch file", "error");
    },
    onFilesSuccessfulySelected: ({ filesContent }) => {
      if (filesContent[0]) {
        try {
          const file = filesContent[0];
          importFromFile(canvas.current, new Uint8Array(file.content as any));
        } catch (e) {
          toast("Unable to import the sketch file", "error");
        }
      } else {
        toast("No sketch file selected", "error");
      }
    }
  });

  /**
   * File import handler
   * @param event Event
   */
  const importFile = (event: React.MouseEvent<HTMLDivElement>): void => {
    event.preventDefault(); // Do not auto-close the menu

    if (canvas.current?.getObjects()?.length) {
      confirmImport({
        color: "ruby",
        onConfirm: openFileSelector,
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
        title: "Overwrite canvas?",
        description:
          "Opening a new sketch file will overwrite the existing layers on the canvas. Do you want to proceed?"
      });
    } else {
      openFileSelector();
    }
  };

  const [element, confirmImport] = useConfirmation(
    <MenuItem
      decorator={<FolderOpenIcon />}
      /*
       * Add an on-click listener to prevent the modal from opening
       * when the menu item is clicked
       */
      onClick={importFile}
      onSelect={importFile as any}
    >
      Open
    </MenuItem>
  );

  return element;
};

export default ImportItem;
