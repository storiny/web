import { MIN_ZOOM } from "../../../constants/new";
import { RootState } from "../../../types";

/**
 * Returns normalized zoom value
 * @param zoom Zoom value
 */
export const getNormalizedZoom = (zoom: number): number =>
  Math.max(MIN_ZOOM, Math.min(zoom, 30));

/**
 * Returns state for new zoom
 * @param viewportX Viewport X coordinate
 * @param viewportY Viewport Y coordinate
 * @param nextZoom New zoom value
 * @param editorState Editor state
 */
export const getStateForZoom = (
  {
    viewportX,
    viewportY,
    nextZoom
  }: {
    nextZoom: number;
    viewportX: number;
    viewportY: number;
  },
  editorState: RootState
): { scrollX: number; scrollY: number; zoom: { value: number } } => {
  const editorLayerX = viewportX - editorState.offsetLeft;
  const editorLayerY = viewportY - editorState.offsetTop;
  const currentZoom = editorState.zoom.value;

  // Get the original scroll position without zoom
  const baseScrollX =
    editorState.scrollX + (editorLayerX - editorLayerX / currentZoom);
  const baseScrollY =
    editorState.scrollY + (editorLayerY - editorLayerY / currentZoom);

  // Get scroll offsets for target zoom level
  const zoomOffsetScrollX = -(editorLayerX - editorLayerX / nextZoom);
  const zoomOffsetScrollY = -(editorLayerY - editorLayerY / nextZoom);

  return {
    scrollX: baseScrollX + zoomOffsetScrollX,
    scrollY: baseScrollY + zoomOffsetScrollY,
    zoom: {
      value: nextZoom
    }
  };
};
