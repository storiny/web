import { Canvas, Group, StaticCanvas } from "fabric";

import { clamp } from "~/utils/clamp";

import { EXPORT_WIDTH } from "../../constants";

/**
 * Zooms the viewport to fit all the objects
 * @param canvas Canvas
 * @param padding Additional padding around the objects
 * @param isExporting If `true`, scales the group to the export image size
 */
export const zoomToObjects = (
  canvas: Canvas | StaticCanvas,
  padding: number = 0,
  isExporting?: boolean
): void => {
  if (canvas.getObjects().length < 1) {
    return;
  }

  let group = canvas.get("exportGroup") as Group | undefined;

  if (!group) {
    group = new Group(canvas.getObjects() as any, {
      selectable: false,
      originY: "center",
      originX: "center"
    });

    canvas.set("exportGroup", group);
  }

  if (!canvas.get("hasSetDimensions")) {
    if (isExporting) {
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
