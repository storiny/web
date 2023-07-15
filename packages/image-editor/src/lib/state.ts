import {
  DEFAULT_ELEMENT_PROPS,
  DEFAULT_FONT_FAMILY,
  DEFAULT_FONT_SIZE,
  DEFAULT_TEXT_ALIGN,
  EXPORT_SCALES
} from "../constants/new";
import { AppState, NormalizedZoomValue } from "./types";

export const getDefaultAppState = (): Omit<
  AppState,
  "offsetTop" | "offsetLeft" | "width" | "height"
> => ({
  cursorButton: "up",
  draggingLayer: null,
  editingLayer: null,
  editingGroupId: null,
  editingLinearLayer: null,
  activeTool: {
    type: "selection",
    customType: null,
    locked: DEFAULT_ELEMENT_PROPS.locked,
    lastActiveTool: null
  },
  penMode: false,
  penDetected: false,
  errorMessage: null,
  exportScale: defaultExportScale,
  fileHandle: null,
  gridSize: null,
  isBindingEnabled: true,
  isLoading: false,
  isResizing: false,
  isRotating: false,
  lastPointerDownWith: "mouse",
  multiLayer: null,
  contextMenu: null,
  previousSelectedLayerIds: {},
  resizingLayer: null,
  scrolledOutside: false,
  scrollX: 0,
  scrollY: 0,
  selectedLayerIds: {},
  selectedGroupIds: {},
  selectedLayersAreBeingDragged: false,
  selectionLayer: null,
  shouldCacheIgnoreZoom: false,
  showStats: false,
  startBoundLayer: null,
  suggestedBindings: [],
  layersToHighlight: null,
  toast: null,
  viewBackgroundColor: "#fff",
  zoom: {
    value: 1 as NormalizedZoomValue
  },
  pendingImageLayerId: null,
  showHyperlinkPopup: false,
  selectedLinearLayer: null
});

/**
 * Config containing all AppState keys. Used to determine whether given state
 *  prop should be stripped when exporting to given storage type.
 */
const APP_STATE_STORAGE_CONF = (<
  Values extends {
    /** whether to keep when storing to browser storage (localStorage/IDB) */
    browser: boolean;
    /** whether to keep when exporting to file/database */
    export: boolean;
    /** server (shareLink/collab/...) */
    server: boolean;
  },
  T extends Record<keyof AppState, Values>
>(config: { [K in keyof T]: K extends keyof AppState ? T[K] : never }) =>
  config)({
  showWelcomeScreen: { browser: true, export: false, server: false },
  theme: { browser: true, export: false, server: false },
  collaborators: { browser: false, export: false, server: false },
  currentChartType: { browser: true, export: false, server: false },
  currentItemBackgroundColor: { browser: true, export: false, server: false },
  currentItemEndArrowhead: { browser: true, export: false, server: false },
  currentItemFillStyle: { browser: true, export: false, server: false },
  currentItemFontFamily: { browser: true, export: false, server: false },
  currentItemFontSize: { browser: true, export: false, server: false },
  currentItemRoundness: {
    browser: true,
    export: false,
    server: false
  },
  currentItemOpacity: { browser: true, export: false, server: false },
  currentItemRoughness: { browser: true, export: false, server: false },
  currentItemStartArrowhead: { browser: true, export: false, server: false },
  currentItemStrokeColor: { browser: true, export: false, server: false },
  currentItemStrokeStyle: { browser: true, export: false, server: false },
  currentItemStrokeWidth: { browser: true, export: false, server: false },
  currentItemTextAlign: { browser: true, export: false, server: false },
  cursorButton: { browser: true, export: false, server: false },
  draggingLayer: { browser: false, export: false, server: false },
  editingLayer: { browser: false, export: false, server: false },
  editingGroupId: { browser: true, export: false, server: false },
  editingLinearLayer: { browser: false, export: false, server: false },
  activeTool: { browser: true, export: false, server: false },
  penMode: { browser: true, export: false, server: false },
  penDetected: { browser: true, export: false, server: false },
  errorMessage: { browser: false, export: false, server: false },
  exportBackground: { browser: true, export: false, server: false },
  exportEmbedScene: { browser: true, export: false, server: false },
  exportScale: { browser: true, export: false, server: false },
  exportWithDarkMode: { browser: true, export: false, server: false },
  fileHandle: { browser: false, export: false, server: false },
  gridSize: { browser: true, export: true, server: true },
  height: { browser: false, export: false, server: false },
  isBindingEnabled: { browser: false, export: false, server: false },
  defaultSidebarDockedPreference: {
    browser: true,
    export: false,
    server: false
  },
  isLoading: { browser: false, export: false, server: false },
  isResizing: { browser: false, export: false, server: false },
  isRotating: { browser: false, export: false, server: false },
  lastPointerDownWith: { browser: true, export: false, server: false },
  multiLayer: { browser: false, export: false, server: false },
  name: { browser: true, export: false, server: false },
  offsetLeft: { browser: false, export: false, server: false },
  offsetTop: { browser: false, export: false, server: false },
  contextMenu: { browser: false, export: false, server: false },
  openMenu: { browser: true, export: false, server: false },
  openPopup: { browser: false, export: false, server: false },
  openSidebar: { browser: true, export: false, server: false },
  openDialog: { browser: false, export: false, server: false },
  pasteDialog: { browser: false, export: false, server: false },
  previousSelectedLayerIds: { browser: true, export: false, server: false },
  resizingLayer: { browser: false, export: false, server: false },
  scrolledOutside: { browser: true, export: false, server: false },
  scrollX: { browser: true, export: false, server: false },
  scrollY: { browser: true, export: false, server: false },
  selectedLayerIds: { browser: true, export: false, server: false },
  selectedGroupIds: { browser: true, export: false, server: false },
  selectedLayersAreBeingDragged: {
    browser: false,
    export: false,
    server: false
  },
  selectionLayer: { browser: false, export: false, server: false },
  shouldCacheIgnoreZoom: { browser: true, export: false, server: false },
  showStats: { browser: true, export: false, server: false },
  startBoundLayer: { browser: false, export: false, server: false },
  suggestedBindings: { browser: false, export: false, server: false },
  frameRendering: { browser: false, export: false, server: false },
  frameToHighlight: { browser: false, export: false, server: false },
  editingFrame: { browser: false, export: false, server: false },
  layersToHighlight: { browser: false, export: false, server: false },
  toast: { browser: false, export: false, server: false },
  viewBackgroundColor: { browser: true, export: true, server: true },
  width: { browser: false, export: false, server: false },
  zenModeEnabled: { browser: true, export: false, server: false },
  zoom: { browser: true, export: false, server: false },
  viewModeEnabled: { browser: false, export: false, server: false },
  pendingImageLayerId: { browser: false, export: false, server: false },
  showHyperlinkPopup: { browser: false, export: false, server: false },
  selectedLinearLayer: { browser: true, export: false, server: false }
});

const _clearAppStateForStorage = <
  ExportType extends "export" | "browser" | "server"
>(
  appState: Partial<AppState>,
  exportType: ExportType
) => {
  type ExportableKeys = {
    [K in keyof typeof APP_STATE_STORAGE_CONF]: (typeof APP_STATE_STORAGE_CONF)[K][ExportType] extends true
      ? K
      : never;
  }[keyof typeof APP_STATE_STORAGE_CONF];
  const stateForExport = {} as { [K in ExportableKeys]?: (typeof appState)[K] };
  for (const key of Object.keys(appState) as (keyof typeof appState)[]) {
    const propConfig = APP_STATE_STORAGE_CONF[key];
    if (propConfig?.[exportType]) {
      const nextValue = appState[key];

      // https://github.com/microsoft/TypeScript/issues/31445
      (stateForExport as any)[key] = nextValue;
    }
  }
  return stateForExport;
};

export const clearAppStateForLocalStorage = (appState: Partial<AppState>) =>
  _clearAppStateForStorage(appState, "browser");

export const cleanAppStateForExport = (appState: Partial<AppState>) =>
  _clearAppStateForStorage(appState, "export");

export const clearAppStateForDatabase = (appState: Partial<AppState>) =>
  _clearAppStateForStorage(appState, "server");

export const isEraserActive = ({
  activeTool
}: {
  activeTool: AppState["activeTool"];
}) => activeTool.type === "eraser";

export const isHandToolActive = ({
  activeTool
}: {
  activeTool: AppState["activeTool"];
}) => activeTool.type === "hand";
