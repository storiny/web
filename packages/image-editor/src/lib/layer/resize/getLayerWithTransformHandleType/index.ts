import { PointerType } from "../../../../constants";
import { EditorState, NonDeletedLayer, Zoom } from "../../../../types";
import { MaybeTransformHandleType } from "../../transformHandles";
import { resizeTest } from "../resizeTest";

/**
 * Returns layer with transform handle type
 * @param layers Layers
 * @param editorState Editor state
 * @param scenePointerX Scene pointer X coordinate
 * @param scenePointerY Scene pointer Y coordinate
 * @param zoom Zoom value
 * @param pointerType Pointer type
 */
export const getLayerWithTransformHandleType = (
  layers: readonly NonDeletedLayer[],
  editorState: EditorState,
  scenePointerX: number,
  scenePointerY: number,
  zoom: Zoom,
  pointerType: PointerType
): {
  layer: NonDeletedLayer;
  transformHandleType: MaybeTransformHandleType;
} | null =>
  layers.reduce((result, layer) => {
    if (result) {
      return result;
    }

    const transformHandleType = resizeTest(
      layer,
      editorState,
      scenePointerX,
      scenePointerY,
      zoom,
      pointerType
    );

    return transformHandleType ? { layer, transformHandleType } : null;
  }, null as { layer: NonDeletedLayer; transformHandleType: MaybeTransformHandleType } | null);
