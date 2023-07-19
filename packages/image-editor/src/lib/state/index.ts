import {
  Arrowhead,
  ChartType,
  DEFAULT_FONT_FAMILY,
  DEFAULT_FONT_SIZE,
  DEFAULT_LAYER_PROPS,
  DEFAULT_TEXT_ALIGN,
  EXPORT_SCALE,
  PointerType,
  Shape,
  StrokeRoundness
} from "../../constants";
import { EditorState } from "../../types";

export const getDefaultEditorState = (): Omit<
  EditorState,
  "offsetTop" | "offsetLeft" | "width" | "height"
> => ({
  currentItemBackgroundColor: DEFAULT_LAYER_PROPS.backgroundColor,
  currentChartType: ChartType.BAR,
  currentItemEndArrowhead: Arrowhead.ARROW,
  currentItemFillStyle: DEFAULT_LAYER_PROPS.fillStyle,
  currentItemFontFamily: DEFAULT_FONT_FAMILY,
  currentItemFontSize: DEFAULT_FONT_SIZE,
  currentItemOpacity: DEFAULT_LAYER_PROPS.opacity,
  currentItemRoughness: DEFAULT_LAYER_PROPS.roughness,
  currentItemRoundness: StrokeRoundness.ROUND,
  currentItemStartArrowhead: null,
  currentItemStrokeColor: DEFAULT_LAYER_PROPS.strokeColor,
  currentItemStrokeStyle: DEFAULT_LAYER_PROPS.strokeStyle,
  currentItemStrokeWidth: DEFAULT_LAYER_PROPS.strokeWidth,
  currentItemTextAlign: DEFAULT_TEXT_ALIGN,
  // cursorButton: "up",
  snapToGrid: false,
  draggingLayer: null,
  editingLayer: null,
  editingGroupId: null,
  editingLinearLayer: null,
  activeTool: {
    type: Shape.SELECTION,
    customType: null,
    locked: DEFAULT_LAYER_PROPS.locked,
    lastActiveTool: null
  },
  penMode: false,
  penDetected: false,
  errorMessage: null,
  exportScale: EXPORT_SCALE,
  fileHandle: null,
  gridSize: null,
  isBindingEnabled: true,
  isLoading: false,
  isResizing: false,
  isRotating: false,
  lastPointerDownWith: PointerType.MOUSE,
  multiLayer: null,
  contextMenu: null,
  previousSelectedLayerIds: {},
  resizingLayer: null,
  scrolledOutside: false,
  // scrollX: 0,
  // scrollY: 0,
  selectedLayerIds: {},
  selectedGroupIds: {},
  selectedLayersAreBeingDragged: false,
  selectionLayer: null,
  shouldCacheIgnoreZoom: false,
  showStats: false,
  // startBoundLayer: null,
  // suggestedBindings: [],
  layersToHighlight: null,
  toast: null,
  viewBackgroundColor: "#fff",
  zoom: {
    value: 1
  },
  pendingImageLayerId: null,
  showHyperlinkPopup: false,
  selectedLinearLayer: null,
  name: "",
  helpModal: false,
  openMenu: null,
  pasteDialog: { shown: false, data: null }
});

/**
 * Properties to include when exporting
 */
const propsToExport: Array<keyof EditorState> = [
  "gridSize",
  "viewBackgroundColor"
];

/**
 * Cleans up the editor state for export
 * @param editorState Editor state
 */
export const cleanEditorStateForExport = (
  editorState: Partial<EditorState>
): Partial<EditorState> => {
  const stateForExport: typeof editorState = {};

  for (const key of Object.keys(editorState) as (keyof typeof editorState)[]) {
    if (propsToExport.includes(key)) {
      (stateForExport as any)[key] = editorState[key];
    }
  }

  return stateForExport;
};
