import React from "react";
import { useFilePicker as use_file_picker } from "use-file-picker";

import { use_confirmation } from "../../../../../ui/src/components/confirmation";
import MenuItem from "../../../../../ui/src/components/menu-item";
import { use_toast } from "../../../../../ui/src/components/toast";
import FolderOpenIcon from "../../../../../ui/src/icons/folder-open";

import { FILE_EXTENSIONS } from "../../../constants";
import { use_canvas } from "../../../hooks";
import { import_from_file } from "../../../utils";

const ImportItem = (): React.ReactElement => {
  const canvas = use_canvas();
  const toast = use_toast();
  const [open_file_selector] = use_file_picker({
    /* eslint-disable prefer-snakecase/prefer-snakecase */
    readAs: "ArrayBuffer",
    accept: FILE_EXTENSIONS.map((ext) => `.${ext}`),
    multiple: false,
    limitFilesConfig: { max: 1, min: 1 },
    /* eslint-enable prefer-snakecase/prefer-snakecase */
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    onFilesRejected: () => {
      toast("Unable to import the sketch file", "error");
    },
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    onFilesSuccessfulySelected: ({ filesContent: files_content }) => {
      if (files_content[0]) {
        try {
          const file = files_content[0];
          import_from_file(canvas.current, new Uint8Array(file.content as any));
        } catch {
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
  const import_file = (event: React.MouseEvent<HTMLDivElement>): void => {
    event.preventDefault(); // Do not auto-close the menu

    if (canvas.current?.getObjects()?.length) {
      confirm_import();
    } else {
      open_file_selector();
    }
  };

  const [element, confirm_import] = use_confirmation(
    () => (
      <MenuItem
        decorator={<FolderOpenIcon />}
        /*
         * Add an on-click listener to prevent the modal from opening
         * when the menu item is clicked
         */
        onClick={import_file}
        onSelect={import_file as any}
      >
        Open…
      </MenuItem>
    ),
    {
      color: "ruby",
      on_confirm: open_file_selector,
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
      title: "Overwrite canvas?",
      description:
        "Opening a new sketch file will overwrite the existing layers on the canvas. Do you want to proceed?"
    }
  );

  return element;
};

export default ImportItem;
