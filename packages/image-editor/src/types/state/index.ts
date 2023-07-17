import React from "react";

import {
  Arrowhead,
  ChartType,
  FillStyle,
  ImageMime,
  PointerType,
  Shape,
  SHAPES,
  StrokeRoundness,
  StrokeStyle,
  TextAlign
} from "../../constants";
import { LinearLayerEditor, SuggestedBinding } from "../../lib/layer";
import { BinaryFiles } from "../binary";
import { Spreadsheet } from "../chart";
import {
  BindableLayer,
  FileId,
  GroupId,
  ImageLayer,
  Layer,
  LinearLayer,
  NonDeleted,
  NonDeletedLayer
} from "../layer";
import { Zoom } from "../zoom";

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
  // Group being edited when we drill down to its constituent layer
  editingGroupId: GroupId | null;
  // Layer being edited, but not necessarily added to layers array yet
  // (e.g., text layer when typing into the input)
  editingLayer: NonDeletedLayer | null;
  editingLinearLayer: LinearLayerEditor | null;
  errorMessage: React.ReactNode;
  exportScale: number;
  // eslint-disable-next-line no-undef
  fileHandle: FileSystemHandle | null;
  gridSize: number | null;
  height: number;
  helpModal: boolean;
  isBindingEnabled: boolean;
  isLoading: boolean;
  isResizing: boolean;
  isRotating: boolean;
  lastPointerDownWith: PointerType;
  layersToHighlight: NonDeleted<Layer>[] | null;
  multiLayer: NonDeleted<LinearLayer> | null;
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
  resizingLayer: NonDeletedLayer | null;
  scrollX: number;
  scrollY: number;
  scrolledOutside: boolean;
  // Top-most selected groups
  selectedGroupIds: { [groupId: string]: boolean };
  selectedLayerIds: Readonly<{ [id: string]: true }>;
  selectedLayersAreBeingDragged: boolean;
  selectedLinearLayer: LinearLayerEditor | null;
  selectionLayer: NonDeletedLayer | null;
  shouldCacheIgnoreZoom: boolean;
  showHyperlinkPopup: false | "info" | "editor";
  showStats: boolean;
  snapToGrid: boolean;
  startBoundLayer: NonDeleted<BindableLayer> | null;
  suggestedBindings: SuggestedBinding[];
  toast: { closable?: boolean; duration?: number; message: string } | null;
  viewBackgroundColor: string;
  width: number;
  zoom: Zoom;
}

export type EditorState = Omit<
  RootState,
  | "suggestedBindings"
  | "startBoundLayer"
  | "cursorButton"
  | "scrollX"
  | "scrollY"
>;

/**
 * Subset of editor class properties that we need to use elsewhere
 * in the editor
 */
export interface EditorClassProperties {
  canvas: HTMLCanvasElement | null;
  // device: App["device"];
  files: BinaryFiles;
  focusContainer(): void;
  // id: App["id"];
  imageCache: Map<
    FileId,
    {
      image: HTMLImageElement | Promise<HTMLImageElement>;
      mimeType: ImageMime;
    }
  >;
  // lastViewportPosition: App["lastViewportPosition"];
  // onExportImage: App["onExportImage"];
  // onInsertLayers: App["onInsertLayers"];
  // pasteFromClipboard: App["pasteFromClipboard"];
  // scene: App["scene"];
}
