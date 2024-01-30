import { Canvas } from "fabric";

import { COMMON_GROUP_PROPS } from "../../../../constants";
import { is_text_object } from "../../../../utils";

export const selection_created_event = (canvas: Canvas): void => {
  canvas.on("selection:created", (options) => {
    if (options.selected.some(is_text_object)) {
      canvas.uniformScaling = true;
    }

    for (const object of options.selected) {
      if (object.group) {
        object.group.setControlsVisibility({ mtr: false });
        object.group.set(COMMON_GROUP_PROPS);
      }

      object.set({
        selected: true
      });
    }
  });
};
