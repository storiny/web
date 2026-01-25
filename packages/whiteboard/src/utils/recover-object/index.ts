import { is_arrow_object } from "../is-arrow-object";
import { is_linear_object } from "../is-linear-object";
import { is_pen_object } from "../is-pen-object";
import { is_scalable_object } from "../is-scalable-object";
import { is_text_object } from "../is-text-object";
import { sync_linear_points } from "../sync-linear-points";

/**
 * Recovers an object be assigning it the required properties
 * @param object Object to recover
 * @param prop Additional properties
 */
export const recover_object = (object: any, prop: any): void => {
  object.set({
    left: prop.left,
    top: prop.top,
    width: prop.width,
    height: prop.height,
    angle: prop.angle,
    locked: prop.locked,
    visible: prop.visible
  });

  if (is_scalable_object(object)) {
    object.set({
      scaleX: prop.scaleX,
      scaleY: prop.scaleY
    });
  } else {
    object.set({
      width: prop.width * prop.scaleX,
      height: prop.height * prop.scaleY,
      scaleX: 1,
      scaleY: 1
    });
  }

  if (is_pen_object(object)) {
    object.set({
      penWidth: prop.penWidth,

      penStyle: prop.penStyle,
      points: prop.points,
      shadow: prop.shadow,
      fill: prop.fill
    });
  }

  if (is_linear_object(object)) {
    object.set({
      x1: prop.x1,
      x2: prop.x2,
      y1: prop.y1,
      y2: prop.y2
    });

    // Set arrowheads
    if (is_arrow_object(object)) {
      object.set({
        startArrowhead: prop.startArrowhead,

        endArrowhead: prop.endArrowhead
      });
    }

    sync_linear_points(object);
  }

  if (is_text_object(object)) {
    object.set({ fontName: prop.fontName });
  }

  if (object.canvas) {
    object.canvas.requestRenderAll();
  }
};
