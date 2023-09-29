import React from "react";

import MenuItem from "../../../../../ui/src/components/menu-item";
import { use_toast } from "../../../../../ui/src/components/toast";
import DownloadIcon from "~/icons/Download";

import { useCanvas } from "../../../hooks";
import { exportToFile } from "../../../utils";

const LocalCopyItem = (): React.ReactElement => {
  const canvas = useCanvas();
  const toast = use_toast();

  /**
   * Saves a local copy of the canvas
   */
  const saveLocalCopy = (): void => {
    if (canvas.current) {
      if (canvas.current.getObjects().length) {
        try {
          exportToFile(canvas.current);
        } catch {
          toast("Unable to export the sketch file", "error");
        }
      } else {
        toast("Cannot export an empty canvas", "error");
      }
    }
  };

  return (
    <MenuItem decorator={<DownloadIcon />} onSelect={saveLocalCopy}>
      Save local copy...
    </MenuItem>
  );
};

export default LocalCopyItem;
