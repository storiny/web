import {
  sceneCoordsToViewportCoords,
  viewportCoordsToSceneCoords
} from "../../../core/utils";
import {
  EditorState,
  Layer,
  PointerCoords,
  RootState,
  Zoom
} from "../../../types";
import {
  getClosestLayerBounds,
  getCommonBounds,
  getVisibleLayers
} from "../../layer";

/**
 * Predicate function for determining overflow
 * @param editorState Editor state
 * @param canvas Canvas element
 * @param cords Coordinates
 */
const isOutsideViewPort = (
  editorState: EditorState,
  canvas: HTMLCanvasElement | null,
  cords: Array<number>
): boolean => {
  const [x1, y1, x2, y2] = cords;
  const { x: viewportX1, y: viewportY1 } = sceneCoordsToViewportCoords(
    { sceneX: x1, sceneY: y1 },
    editorState
  );
  const { x: viewportX2, y: viewportY2 } = sceneCoordsToViewportCoords(
    { sceneX: x2, sceneY: y2 },
    editorState
  );

  return (
    viewportX2 - viewportX1 > editorState.width ||
    viewportY2 - viewportY1 > editorState.height
  );
};

/**
 * Determines the scroll value to the center of the viewport
 * @param scenePoint Scene pointer coordinates
 * @param viewportDimensions Viewport dimensions
 * @param zoom Zoom value
 */
export const centerScrollOn = ({
  scenePoint,
  viewportDimensions,
  zoom
}: {
  scenePoint: PointerCoords;
  viewportDimensions: { height: number; width: number };
  zoom: Zoom;
}): { scrollX: number; scrollY: number } => ({
  scrollX: viewportDimensions.width / 2 / zoom.value - scenePoint.x,
  scrollY: viewportDimensions.height / 2 / zoom.value - scenePoint.y
});

/**
 * Computes the props for center scroll
 * @param layers Layers
 * @param editorState Editor state
 * @param canvas Canvas element
 */
export const calculateScrollCenter = (
  layers: readonly Layer[],
  editorState: RootState,
  canvas: HTMLCanvasElement | null
): { scrollX: number; scrollY: number } => {
  layers = getVisibleLayers(layers);

  if (!layers.length) {
    return {
      scrollX: 0,
      scrollY: 0
    };
  }

  let [x1, y1, x2, y2] = getCommonBounds(layers);

  if (isOutsideViewPort(editorState, canvas, [x1, y1, x2, y2])) {
    [x1, y1, x2, y2] = getClosestLayerBounds(
      layers,
      viewportCoordsToSceneCoords(
        { clientX: editorState.scrollX, clientY: editorState.scrollY },
        editorState
      )
    );
  }

  const centerX = (x1 + x2) / 2;
  const centerY = (y1 + y2) / 2;

  return centerScrollOn({
    scenePoint: { x: centerX, y: centerY },
    viewportDimensions: {
      width: editorState.width,
      height: editorState.height
    },
    zoom: editorState.zoom
  });
};
