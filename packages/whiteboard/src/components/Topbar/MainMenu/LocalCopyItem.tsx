import React from "react";

import MenuItem from "~/components/MenuItem";
import { useToast } from "~/components/Toast";
import DownloadIcon from "~/icons/Download";

import { useCanvas } from "../../../hooks";
import { exportToFile } from "../../../utils";

const LocalCopyItem = (): React.ReactElement => {
  const canvas = useCanvas();
  const toast = useToast();

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
