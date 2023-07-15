import React from "react";
import { Point as RoughPoint } from "roughjs/bin/geometry";

import type { FileSystemHandle } from "../lib/data/fs/filesystem";
import Library from "../lib/data/library";
import { ImportedDataState } from "../lib/data/types";
import { isOverScrollBars } from "../lib/scene";
import { Spreadsheet } from "./charts";
import { ClipboardData } from "./clipboard";
import type App from "./components/App";
import { ContextMenuItems } from "./components/ContextMenu";
import type { IMAGE_MIME_TYPES, MIME_TYPES } from "./constants";
import { Language } from "./i18n";
import { SuggestedBinding } from "./layer/binding";
import { LinearLayerEditor } from "./layer/linearLayerEditor";
import { MaybeTransformHandleType } from "./layer/transformHandles";
import {
  Arrowhead,
  ChartType,
  ExcalidrawBindableLayer,
  ExcalidrawFrameLayer,
  ExcalidrawImageLayer,
  ExcalidrawLayer,
  ExcalidrawLinearLayer,
  FileId,
  FontFamilyValues,
  GroupId,
  NonDeleted,
  NonDeletedExcalidrawLayer,
  PointerType,
  StrokeRoundness,
  TextAlign,
  Theme
} from "./layer/types";
import { SHAPES } from "./shapes";
import { ForwardRef, Merge, ValueOf } from "./utility-types";
import type { ResolvablePromise, throttleRAF } from "./utils";

export type Point = Readonly<RoughPoint>;

export type Collaborator = {
  // The url of the collaborator's avatar, defaults to username intials
  // if not present
  avatarUrl?: string;
  button?: "up" | "down";
  color?: {
    background: string;
    stroke: string;
  };
  // user id. If supplied, we'll filter out duplicates when rendering user avatars.
  id?: string;
  pointer?: {
    x: number;
    y: number;
  };
  selectedLayerIds?: AppState["selectedLayerIds"];
  userState?: UserIdleState;
  username?: string | null;
};

export type DataURL = string & { _brand: "DataURL" };

export type BinaryFileData = {
  /**
   * Epoch timestamp in milliseconds
   */
  created: number;
  dataURL: DataURL;
  id: FileId;
  /**
   * Indicates when the file was last retrieved from storage to be loaded
   * onto the scene. We use this flag to determine whether to delete unused
   * files from storage.
   *
   * Epoch timestamp in milliseconds.
   */
  lastRetrieved?: number;
  mimeType:
    | ValueOf<typeof IMAGE_MIME_TYPES>
    // future user or unknown file type
    | typeof MIME_TYPES.binary;
};

export type BinaryFileMetadata = Omit<BinaryFileData, "dataURL">;

export type BinaryFiles = Record<ExcalidrawLayer["id"], BinaryFileData>;

export type LastActiveTool =
  | {
      customType: null;
      type: (typeof SHAPES)[number]["value"] | "eraser" | "hand" | "frame";
    }
  | {
      customType: string;
      type: "custom";
    }
  | null;

export type SidebarName = string;
export type SidebarTabName = string;

export type AppState = {
  activeTool: {
    /**
     * indicates a previous tool we should revert back to if we deselect the
     * currently active tool. At the moment applies to `eraser` and `hand` tool.
     */
    lastActiveTool: LastActiveTool;
    locked: boolean;
  } & (
    | {
        customType: null;
        type: (typeof SHAPES)[number]["value"] | "eraser" | "hand" | "frame";
      }
    | {
        customType: string;
        type: "custom";
      }
  );
  collaborators: Map<string, Collaborator>;
  contextMenu: {
    items: ContextMenuItems;
    left: number;
    top: number;
  } | null;
  currentChartType: ChartType;
  currentItemBackgroundColor: string;
  currentItemEndArrowhead: Arrowhead | null;
  currentItemFillStyle: ExcalidrawLayer["fillStyle"];
  currentItemFontFamily: FontFamilyValues;
  currentItemFontSize: number;
  currentItemOpacity: number;
  currentItemRoughness: number;
  currentItemRoundness: StrokeRoundness;
  currentItemStartArrowhead: Arrowhead | null;
  currentItemStrokeColor: string;
  currentItemStrokeStyle: ExcalidrawLayer["strokeStyle"];
  currentItemStrokeWidth: number;
  currentItemTextAlign: TextAlign;
  cursorButton: "up" | "down";
  /**
   * Reflects user preference for whether the default sidebar should be docked.
   *
   * NOTE this is only a user preference and does not reflect the actual docked
   * state of the sidebar, because the host apps can override this through
   * a DefaultSidebar prop, which is not reflected back to the appState.
   */
  defaultSidebarDockedPreference: boolean;
  draggingLayer: NonDeletedExcalidrawLayer | null;
  editingFrame: string | null;
  /** group being edited when you drill down to its constituent layer
    (e.g. when you double-click on a group's layer) */
  editingGroupId: GroupId | null;
  // layer being edited, but not necessarily added to layers array yet
  // (e.g. text layer when typing into the input)
  editingLayer: NonDeletedExcalidrawLayer | null;
  editingLinearLayer: LinearLayerEditor | null;
  errorMessage: React.ReactNode;
  exportBackground: boolean;
  exportEmbedScene: boolean;
  exportScale: number;
  exportWithDarkMode: boolean;
  fileHandle: FileSystemHandle | null;
  frameRendering: {
    clip: boolean;
    enabled: boolean;
    name: boolean;
    outline: boolean;
  };
  frameToHighlight: NonDeleted<ExcalidrawFrameLayer> | null;
  gridSize: number | null;
  height: number;
  isBindingEnabled: boolean;
  isLoading: boolean;
  isResizing: boolean;
  isRotating: boolean;
  lastPointerDownWith: PointerType;
  layersToHighlight: NonDeleted<ExcalidrawLayer>[] | null;
  multiLayer: NonDeleted<ExcalidrawLinearLayer> | null;
  name: string;
  offsetLeft: number;
  offsetTop: number;
  openDialog: "imageExport" | "help" | "jsonExport" | null;
  openMenu: "canvas" | "shape" | null;
  openPopup: "canvasBackground" | "layerBackground" | "layerStroke" | null;
  openSidebar: { name: SidebarName; tab?: SidebarTabName } | null;
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

  /** imageLayer waiting to be placed on canvas */
  pendingImageLayerId: ExcalidrawImageLayer["id"] | null;
  previousSelectedLayerIds: { [id: string]: true };
  resizingLayer: NonDeletedExcalidrawLayer | null;
  scrollX: number;
  scrollY: number;
  scrolledOutside: boolean;
  /** top-most selected groups (i.e. does not include nested groups) */
  selectedGroupIds: { [groupId: string]: boolean };
  selectedLayerIds: Readonly<{ [id: string]: true }>;
  selectedLayersAreBeingDragged: boolean;
  selectedLinearLayer: LinearLayerEditor | null;

  selectionLayer: NonDeletedExcalidrawLayer | null;
  shouldCacheIgnoreZoom: boolean;
  showHyperlinkPopup: false | "info" | "editor";
  showStats: boolean;
  showWelcomeScreen: boolean;
  startBoundLayer: NonDeleted<ExcalidrawBindableLayer> | null;

  suggestedBindings: SuggestedBinding[];
  theme: Theme;
  toast: { closable?: boolean; duration?: number; message: string } | null;
  viewBackgroundColor: string;
  viewModeEnabled: boolean;
  width: number;
  zenModeEnabled: boolean;
  zoom: Zoom;
};

export type UIAppState = Omit<
  AppState,
  | "suggestedBindings"
  | "startBoundLayer"
  | "cursorButton"
  | "scrollX"
  | "scrollY"
>;

export type NormalizedZoomValue = number & { _brand: "normalizedZoom" };

export type Zoom = Readonly<{
  value: NormalizedZoomValue;
}>;

export type PointerCoords = Readonly<{
  x: number;
  y: number;
}>;

export type Gesture = {
  initialDistance: number | null;
  initialScale: number | null;
  lastCenter: { x: number; y: number } | null;
  pointers: Map<number, PointerCoords>;
};

export declare class GestureEvent extends UIEvent {
  readonly rotation: number;
  readonly scale: number;
}

// libraries
// -----------------------------------------------------------------------------
/** @deprecated legacy: do not use outside of migration paths */
export type LibraryItem_v1 = readonly NonDeleted<ExcalidrawLayer>[];
/** @deprecated legacy: do not use outside of migration paths */
type LibraryItems_v1 = readonly LibraryItem_v1[];

/** v2 library item */
export type LibraryItem = {
  /** timestamp in epoch (ms) */
  created: number;
  error?: string;
  id: string;
  layers: readonly NonDeleted<ExcalidrawLayer>[];
  name?: string;
  status: "published" | "unpublished";
};
export type LibraryItems = readonly LibraryItem[];
export type LibraryItems_anyVersion = LibraryItems | LibraryItems_v1;

export type LibraryItemsSource =
  | ((
      currentLibraryItems: LibraryItems
    ) =>
      | Blob
      | LibraryItems_anyVersion
      | Promise<LibraryItems_anyVersion | Blob>)
  | Blob
  | LibraryItems_anyVersion
  | Promise<LibraryItems_anyVersion | Blob>;
// -----------------------------------------------------------------------------

// NOTE ready/readyPromise props are optional for host apps' sake (our own
// implem guarantees existence)
export type ExcalidrawAPIRefValue =
  | ExcalidrawImperativeAPI
  | {
      ready?: false;
      readyPromise?: ResolvablePromise<ExcalidrawImperativeAPI>;
    };

export type ExcalidrawInitialDataState = Merge<
  ImportedDataState,
  {
    libraryItems?:
      | Required<ImportedDataState>["libraryItems"]
      | Promise<Required<ImportedDataState>["libraryItems"]>;
  }
>;

export interface ExcalidrawProps {
  UIOptions?: Partial<UIOptions>;
  autoFocus?: boolean;
  children?: React.ReactNode;
  detectScroll?: boolean;
  excalidrawRef?: ForwardRef<ExcalidrawAPIRefValue>;
  generateIdForFile?: (file: File) => string | Promise<string>;
  gridModeEnabled?: boolean;
  handleKeyboardGlobally?: boolean;
  initialData?:
    | ExcalidrawInitialDataState
    | null
    | Promise<ExcalidrawInitialDataState | null>;
  isCollaborating?: boolean;
  langCode?: Language["code"];
  libraryReturnUrl?: string;
  name?: string;
  onChange?: (
    layers: readonly ExcalidrawLayer[],
    appState: AppState,
    files: BinaryFiles
  ) => void;
  onLibraryChange?: (libraryItems: LibraryItems) => void | Promise<any>;
  onLinkOpen?: (
    layer: NonDeletedExcalidrawLayer,
    event: CustomEvent<{
      nativeEvent: MouseEvent | React.PointerEvent<HTMLCanvasLayer>;
    }>
  ) => void;
  onPaste?: (
    data: ClipboardData,
    event: ClipboardEvent | null
  ) => Promise<boolean> | boolean;
  onPointerDown?: (
    activeTool: AppState["activeTool"],
    pointerDownState: PointerDownState
  ) => void;
  onPointerUpdate?: (payload: {
    button: "down" | "up";
    pointer: { x: number; y: number };
    pointersMap: Gesture["pointers"];
  }) => void;
  onScrollChange?: (scrollX: number, scrollY: number) => void;
  renderCustomStats?: (
    layers: readonly NonDeletedExcalidrawLayer[],
    appState: UIAppState
  ) => JSX.Layer;
  renderTopRightUI?: (
    isMobile: boolean,
    appState: UIAppState
  ) => JSX.Layer | null;
  theme?: Theme;
  viewModeEnabled?: boolean;
  zenModeEnabled?: boolean;
}

export type SceneData = {
  appState?: ImportedDataState["appState"];
  collaborators?: Map<string, Collaborator>;
  commitToHistory?: boolean;
  layers?: ImportedDataState["layers"];
};

export enum UserIdleState {
  ACTIVE = "active",
  AWAY = "away",
  IDLE = "idle"
}

export type ExportOpts = {
  onExportToBackend?: (
    exportedLayers: readonly NonDeletedExcalidrawLayer[],
    appState: UIAppState,
    files: BinaryFiles,
    canvas: HTMLCanvasLayer | null
  ) => void;
  renderCustomUI?: (
    exportedLayers: readonly NonDeletedExcalidrawLayer[],
    appState: UIAppState,
    files: BinaryFiles,
    canvas: HTMLCanvasLayer | null
  ) => JSX.Layer;
  saveFileToDisk?: boolean;
};

// NOTE at the moment, if action name coressponds to canvasAction prop, its
// truthiness value will determine whether the action is rendered or not
// (see manager renderAction). We also override canvasAction values in
// excalidraw package index.tsx.
type CanvasActions = Partial<{
  changeViewBackgroundColor: boolean;
  clearCanvas: boolean;
  export: false | ExportOpts;
  loadScene: boolean;
  saveAsImage: boolean;
  saveToActiveFile: boolean;
  toggleTheme: boolean | null;
}>;

type UIOptions = Partial<{
  canvasActions: CanvasActions;
  dockedSidebarBreakpoint: number;
  /** @deprecated does nothing. Will be removed in 0.15 */
  welcomeScreen?: boolean;
}>;

export type AppProps = Merge<
  ExcalidrawProps,
  {
    UIOptions: Merge<
      UIOptions,
      {
        canvasActions: Required<CanvasActions> & { export: ExportOpts };
      }
    >;
    children?: React.ReactNode;
    detectScroll: boolean;
    handleKeyboardGlobally: boolean;
    isCollaborating: boolean;
  }
>;

/** A subset of App class properties that we need to use elsewhere
 * in the app, eg Manager. Factored out into a separate type to keep DRY. */
export type AppClassProperties = {
  canvas: HTMLCanvasLayer | null;
  device: App["device"];
  files: BinaryFiles;
  focusContainer(): void;
  id: App["id"];
  imageCache: Map<
    FileId,
    {
      image: HTMLImageLayer | Promise<HTMLImageLayer>;
      mimeType: ValueOf<typeof IMAGE_MIME_TYPES>;
    }
  >;
  lastViewportPosition: App["lastViewportPosition"];
  library: Library;
  onExportImage: App["onExportImage"];
  onInsertLayers: App["onInsertLayers"];
  pasteFromClipboard: App["pasteFromClipboard"];
  props: AppProps;
  scene: App["scene"];
};

export type PointerDownState = Readonly<{
  boxSelection: {
    hasOccurred: boolean;
  };
  drag: {
    // Might change during the pointer interaction
    hasOccurred: boolean;
    // Might change during the pointer interaction
    offset: { x: number; y: number } | null;
  };
  // We need to have these in the state so that we can unsubscribe them
  eventListeners: {
    // It's defined on the initial pointer down event
    onKeyDown: null | ((event: KeyboardEvent) => void);
    // It's defined on the initial pointer down event
    onKeyUp: null | ((event: KeyboardEvent) => void);
    // It's defined on the initial pointer down event
    onMove: null | ReturnType<typeof throttleRAF>;
    // It's defined on the initial pointer down event
    onUp: null | ((event: PointerEvent) => void);
  };
  hit: {
    // The layers the pointer is "hitting", is determined on the initial
    // pointer down event
    allHitLayers: NonDeleted<ExcalidrawLayer>[];
    // Whether selected layer(s) were duplicated, might change during the
    // pointer interaction
    hasBeenDuplicated: boolean;
    hasHitCommonBoundingBoxOfSelectedLayers: boolean;
    // The layer the pointer is "hitting", is determined on the initial
    // pointer down event
    layer: NonDeleted<ExcalidrawLayer> | null;
    // This is determined on the initial pointer down event
    wasAddedToSelection: boolean;
  };
  // The previous pointer position
  lastCoords: { x: number; y: number };
  layerIdsToErase: {
    [key: ExcalidrawLayer["id"]]: {
      erase: boolean;
      opacity: ExcalidrawLayer["opacity"];
    };
  };
  // The first position at which pointerDown happened
  origin: Readonly<{ x: number; y: number }>;
  // Same as "origin" but snapped to the grid, if grid is on
  originInGrid: Readonly<{ x: number; y: number }>;
  // map of original layers data
  originalLayers: Map<string, NonDeleted<ExcalidrawLayer>>;
  resize: {
    // This is determined on the initial pointer down event
    arrowDirection: "origin" | "end";
    // This is a center point of selected layers determined on the initial pointer down event (for rotation only)
    center: { x: number; y: number };
    // Handle when resizing, might change during the pointer interaction
    handleType: MaybeTransformHandleType;
    // This is determined on the initial pointer down event
    isResizing: boolean;
    // This is determined on the initial pointer down event
    offset: { x: number; y: number };
  };
  // Scrollbar checks
  scrollbars: ReturnType<typeof isOverScrollBars>;
  withCmdOrCtrl: boolean;
}>;

export type ExcalidrawImperativeAPI = {
  addFiles: (data: BinaryFileData[]) => void;
  getAppState: () => InstanceType<typeof App>["state"];
  getFiles: () => InstanceType<typeof App>["files"];
  getSceneLayers: InstanceType<typeof App>["getSceneLayers"];
  getSceneLayersIncludingDeleted: InstanceType<
    typeof App
  >["getSceneLayersIncludingDeleted"];
  history: {
    clear: InstanceType<typeof App>["resetHistory"];
  };
  id: string;
  ready: true;
  readyPromise: ResolvablePromise<ExcalidrawImperativeAPI>;
  refresh: InstanceType<typeof App>["refresh"];
  resetCursor: InstanceType<typeof App>["resetCursor"];
  resetScene: InstanceType<typeof App>["resetScene"];
  scrollToContent: InstanceType<typeof App>["scrollToContent"];
  setActiveTool: InstanceType<typeof App>["setActiveTool"];
  setCursor: InstanceType<typeof App>["setCursor"];
  setToast: InstanceType<typeof App>["setToast"];
  toggleSidebar: InstanceType<typeof App>["toggleSidebar"];
  /**
   * Disables rendering of frames (including layer clipping), but currently
   * the frames are still interactive in edit mode. As such, this API should be
   * used in conjunction with view mode (props.viewModeEnabled).
   */
  updateFrameRendering: InstanceType<typeof App>["updateFrameRendering"];
  updateLibrary: InstanceType<typeof Library>["updateLibrary"];
  updateScene: InstanceType<typeof App>["updateScene"];
};

export type Device = Readonly<{
  canDeviceFitSidebar: boolean;
  isLandscape: boolean;
  isMobile: boolean;
  isSmScreen: boolean;
  isTouchScreen: boolean;
}>;

type FrameNameBounds = {
  angle: number;
  height: number;
  width: number;
  x: number;
  y: number;
};

export type FrameNameBoundsCache = {
  _cache: Map<
    string,
    FrameNameBounds & {
      versionNonce: ExcalidrawFrameLayer["versionNonce"];
      zoom: AppState["zoom"]["value"];
    }
  >;
  get: (frameLayer: ExcalidrawFrameLayer) => FrameNameBounds | null;
};
