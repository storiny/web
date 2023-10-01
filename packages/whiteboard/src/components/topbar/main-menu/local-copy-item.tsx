import React from "react";

import MenuItem from "~/components/menu-item";
import { use_toast } from "~/components/toast";
import DownloadIcon from "~/icons/download";

import { use_canvas } from "../../../hooks";
import { export_to_file } from "../../../utils";

const LocalCopyItem = (): React.ReactElement => {
  const canvas = use_canvas();
  const toast = use_toast();

  /**
   * Saves a local copy of the canvas
   */
  const save_local_copy = (): void => {
    if (canvas.current) {
      if (canvas.current.getObjects().length) {
        try {
          export_to_file(canvas.current);
        } catch {
          toast("Unable to export the sketch file", "error");
        }
      } else {
        toast("Cannot export an empty canvas", "error");
      }
    }
  };

  return (
    <MenuItem decorator={<DownloadIcon />} onSelect={save_local_copy}>
      Save local copy...
    </MenuItem>
  );
};

export default LocalCopyItem;
