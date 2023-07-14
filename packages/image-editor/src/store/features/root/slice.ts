import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import React from "react";

import { clamp } from "~/utils/clamp";

import {
  Arrowhead,
  CanvasPattern,
  ChartType,
  DEFAULT_CANVAS_PATTERN,
  DEFAULT_DIMENSION,
  DEFAULT_ROTATION,
  DEFAULT_ZOOM_LEVEL,
  FillStyle,
  MAX_DIMENSION,
  MAX_ROTATION,
  MAX_ZOOM_LEVEL,
  MIN_DIMENSION,
  MIN_ROTATION,
  MIN_ZOOM_LEVEL,
  PointerType,
  Shape,
  SHAPES,
  StrokeRoundness,
  StrokeStyle,
  TextAlign
} from "../../../constants";
import {
  BindableLayer,
  Dimension,
  GroupId,
  ImageLayer,
  Layer,
  LinearLayer,
  NonDeleted,
  NonDeletedLayer,
  Zoom
} from "../../../types";

export type LastActiveTool = {
  customType: null;
  type: Shape;
} | null;

export interface RootState {
  activeTool: {
    /**
     * Indicates a previous tool we should revert back to if we deselect the
     * currently active tool
     */
    lastActiveTool: LastActiveTool;
    locked: boolean;
  } & (
    | {
        customType: null;
        type: (typeof SHAPES)[number]["value"] | "eraser" | "hand";
      }
    | {
        customType: string;
        type: "custom";
      }
  );
  contextMenu: {
    items: ContextMenuItems;
    left: number;
    top: number;
  } | null;
  currentChartType: ChartType;
  currentItemBackgroundColor: string;
  currentItemEndArrowhead: Arrowhead | null;
  currentItemFillStyle: FillStyle;
  currentItemFontFamily: string;
  currentItemFontSize: number;
  currentItemOpacity: number;
  currentItemRoughness: number;
  currentItemRoundness: StrokeRoundness;
  currentItemStartArrowhead: Arrowhead | null;
  currentItemStrokeColor: string;
  currentItemStrokeStyle: StrokeStyle;
  currentItemStrokeWidth: number;
  currentItemTextAlign: TextAlign;
  cursorButton: "up" | "down";
  draggingLayer: NonDeletedLayer | null;
  // Group being edited when we drill down to its constituent element
  editingGroupId: GroupId | null;
  // Layer being edited, but not necessarily added to layers array yet
  // (e.g., text element when typing into the input)
  editingLayer: NonDeletedLayer | null;
  editingLinearLayer: LinearElementEditor | null;
  elementsToHighlight: NonDeleted<Layer>[] | null;
  errorMessage: React.ReactNode;
  exportScale: number;
  fileHandle: FileSystemHandle | null;
  gridSize: number | null;
  height: number;
  helpModal: boolean;
  isBindingEnabled: boolean;
  isLoading: boolean;
  isResizing: boolean;
  isRotating: boolean;
  lastPointerDownWith: PointerType;
  multiElement: NonDeleted<LinearLayer> | null;
  name: string;
  offsetLeft: number;
  offsetTop: number;
  openMenu: "canvas" | "shape" | null;
  pasteDialog:
    | {
        data: null;
        shown: false;
      }
    | {
        data: Spreadsheet;
        shown: true;
      };
  penDetected: boolean;
  penMode: boolean;
  // Image layer waiting to be placed on canvas
  pendingImageLayerId: ImageLayer["id"] | null;
  previousSelectedLayerIds: { [id: string]: true };
  resizingElement: NonDeletedLayer | null;
  scrollX: number;
  scrollY: number;
  scrolledOutside: boolean;
  // Top-most selected groups
  selectedGroupIds: { [groupId: string]: boolean };
  selectedLayerIds: Readonly<{ [id: string]: true }>;
  selectedLayersAreBeingDragged: boolean;
  selectedLinearLayer: LinearElementEditor | null;
  selectionLayer: NonDeletedLayer | null;
  shouldCacheIgnoreZoom: boolean;
  showHyperlinkPopup: false | "info" | "editor";
  showStats: boolean;
  startBoundLayer: NonDeleted<BindableLayer> | null;
  suggestedBindings: SuggestedBinding[];
  toast: { closable?: boolean; duration?: number; message: string } | null;
  viewBackgroundColor: string;
  width: number;
  zoom: Zoom;
}

export type AppState = Omit<
  RootState,
  | "suggestedBindings"
  | "startBoundElement"
  | "cursorButton"
  | "scrollX"
  | "scrollY"
>;

export type SceneData = {
  appState?: ImportedDataState["appState"];
  commitToHistory?: boolean;
  elements?: ImportedDataState["elements"];
};

export interface Device {
  isMobile: boolean;
  isSmScreen: boolean;
  isTouchScreen: boolean;
}

export const rootInitialState: RootState = {
  dimension: DEFAULT_DIMENSION,
  pattern: DEFAULT_CANVAS_PATTERN,
  rotation: DEFAULT_ROTATION,
  zoom: DEFAULT_ZOOM_LEVEL
};

export const rootSlice = createSlice({
  name: "root",
  initialState: rootInitialState,
  reducers: {
    setDimension: (state, action: PayloadAction<Dimension>) => {
      const { height, width } = action.payload;
      state.dimension = {
        height: clamp(MIN_DIMENSION, height, MAX_DIMENSION),
        width: clamp(MIN_DIMENSION, width, MAX_DIMENSION)
      };
    },
    setPattern: (state, action: PayloadAction<CanvasPattern>) => {
      state.pattern = action.payload;
    },
    setRotation: (state, action: PayloadAction<number>) => {
      state.rotation = clamp(MIN_ROTATION, action.payload, MAX_ROTATION);
    },
    setZoom: (state, action: PayloadAction<number>) => {
      state.zoom = clamp(MIN_ZOOM_LEVEL, action.payload, MAX_ZOOM_LEVEL);
    }
  }
});

const { setDimension, setPattern, setRotation, setZoom } = rootSlice.actions;

export { setDimension, setPattern, setRotation, setZoom };
export default rootSlice.reducer;
