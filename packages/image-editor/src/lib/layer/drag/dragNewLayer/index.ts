import { LayerType } from "../../../../constants";
import { NonDeletedLayer } from "../../../../types";
import { mutateLayer } from "../../mutate";
import { getPerfectLayerSize } from "../../resize";

/**
 * Drag handler for new layer
 * @param draggingLayer Layer to drag
 * @param layerType Layer type
 * @param originX Origin X
 * @param originY Origin Y
 * @param x X value
 * @param y Y value
 * @param width Layer width
 * @param height Layer height
 * @param shouldMaintainAspectRatio Whether to maintain aspect ratio
 * @param shouldResizeFromCenter Whether to resize from center
 * @param widthAspectRatio Whether to keep the given aspect ratio when `isResizeWithSidesSameLength` is `true`
 */
export const dragNewLayer = (
  draggingLayer: NonDeletedLayer,
  layerType: LayerType,
  originX: number,
  originY: number,
  x: number,
  y: number,
  width: number,
  height: number,
  shouldMaintainAspectRatio: boolean,
  shouldResizeFromCenter: boolean,
  widthAspectRatio?: number | null
): void => {
  if (shouldMaintainAspectRatio && draggingLayer.type !== LayerType.SELECTION) {
    if (widthAspectRatio) {
      height = width / widthAspectRatio;
    } else {
      // Depending on where the cursor is at (x, y) relative to where the starting point is
      // (originX, originY), we use only width or height to control size increase.
      // This allows the cursor to always "stick" to one of the sides of the bounding box.
      if (Math.abs(y - originY) > Math.abs(x - originX)) {
        ({ width, height } = getPerfectLayerSize(
          layerType,
          height,
          x < originX ? -width : width
        ));
      } else {
        ({ width, height } = getPerfectLayerSize(
          layerType,
          width,
          y < originY ? -height : height
        ));
      }

      if (height < 0) {
        height = -height;
      }
    }
  }

  let newX = x < originX ? originX - width : originX;
  let newY = y < originY ? originY - height : originY;

  if (shouldResizeFromCenter) {
    width += width;
    height += height;
    newX = originX - width / 2;
    newY = originY - height / 2;
  }

  if (width !== 0 && height !== 0) {
    mutateLayer(draggingLayer, {
      x: newX,
      y: newY,
      width,
      height
    });
  }
};
