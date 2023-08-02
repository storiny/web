import { Canvas } from "fabric";

import { COMMON_GROUP_PROPS } from "../../../../constants";

export const selectionUpdatedEvent = (canvas: Canvas): void => {
  canvas.on("selection:updated", (options) => {
    for (const object of options.selected) {
      if (object.group) {
        object.group.setControlsVisibility({ mtr: false });
        object.group.set(COMMON_GROUP_PROPS);
      }

      object.set({
        selected: true
      });
    }

    for (const object of options.deselected) {
      object.set({
        selected: false
      });
    }
  });
};
