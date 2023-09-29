import { Canvas, Group, StaticCanvas } from "fabric";

import { clamp } from "~/utils/clamp";

import { EXPORT_WIDTH } from "../../constants";

/**
 * Zooms the viewport to fit all the objects
 * @param canvas Canvas
 * @param padding Additional padding around the objects
 * @param is_exporting If `true`, scales the group to the export image size
 */
export const zoom_to_objects = (
  canvas: Canvas | StaticCanvas,
  padding = 0,
  is_exporting?: boolean
): void => {
  if (canvas.getObjects().length < 1) {
    return;
  }

  let group = canvas.get("exportGroup") as Group | undefined;

  if (!group) {
    group = new Group(canvas.getObjects() as any, {
      selectable: false,
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      originY: "center",
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      originX: "center"
    });

    canvas.set("exportGroup", group);
  }

  if (!canvas.get("hasSetDimensions")) {
    if (is_exporting) {
      group.scaleToWidth(EXPORT_WIDTH);
      group.width = group.getScaledWidth();
      group.height = group.getScaledHeight();
    }

    canvas.setDimensions({
      width: group.width,
      height: group.height
    });

    canvas.set("hasSetDimensions", true);
  }

  group.scaleToWidth(clamp(0, group.width - padding, Infinity));

  canvas.viewportCenterObject(group);
  canvas.setZoom(1);
};
