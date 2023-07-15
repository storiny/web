import React from "react";

import { ExcalidrawLayer } from "../layer/types";
import {
  AppClassProperties,
  AppState,
  BinaryFiles,
  ExcalidrawProps
} from "../types";
import { MarkOptional } from "../utility-types";

export type ActionSource = "ui" | "keyboard" | "contextMenu" | "api";

/** if false, the action should be prevented */
export type ActionResult =
  | {
      appState?: MarkOptional<
        AppState,
        "offsetTop" | "offsetLeft" | "width" | "height"
      > | null;
      commitToHistory: boolean;
      files?: BinaryFiles | null;
      layers?: readonly ExcalidrawLayer[] | null;
      replaceFiles?: boolean;
      syncHistory?: boolean;
    }
  | false;

type ActionFn = (
  layers: readonly ExcalidrawLayer[],
  appState: Readonly<AppState>,
  formData: any,
  app: AppClassProperties
) => ActionResult | Promise<ActionResult>;

export type UpdaterFn = (res: ActionResult) => void;
export type ActionFilterFn = (action: Action) => void;

export type ActionName =
  | "copy"
  | "cut"
  | "paste"
  | "copyAsPng"
  | "copyAsSvg"
  | "copyText"
  | "sendBackward"
  | "bringForward"
  | "sendToBack"
  | "bringToFront"
  | "copyStyles"
  | "selectAll"
  | "pasteStyles"
  | "gridMode"
  | "zenMode"
  | "stats"
  | "changeStrokeColor"
  | "changeBackgroundColor"
  | "changeFillStyle"
  | "changeStrokeWidth"
  | "changeStrokeShape"
  | "changeSloppiness"
  | "changeStrokeStyle"
  | "changeArrowhead"
  | "changeOpacity"
  | "changeFontSize"
  | "toggleCanvasMenu"
  | "toggleEditMenu"
  | "undo"
  | "redo"
  | "finalize"
  | "changeProjectName"
  | "changeExportBackground"
  | "changeExportEmbedScene"
  | "changeExportScale"
  | "saveToActiveFile"
  | "saveFileToDisk"
  | "loadScene"
  | "duplicateSelection"
  | "deleteSelectedLayers"
  | "changeViewBackgroundColor"
  | "clearCanvas"
  | "zoomIn"
  | "zoomOut"
  | "resetZoom"
  | "zoomToFit"
  | "zoomToFitSelection"
  | "zoomToFitSelectionInViewport"
  | "changeFontFamily"
  | "changeTextAlign"
  | "changeVerticalAlign"
  | "toggleFullScreen"
  | "toggleShortcuts"
  | "group"
  | "ungroup"
  | "goToCollaborator"
  | "addToLibrary"
  | "changeRoundness"
  | "alignTop"
  | "alignBottom"
  | "alignLeft"
  | "alignRight"
  | "alignVerticallyCentered"
  | "alignHorizontallyCentered"
  | "distributeHorizontally"
  | "distributeVertically"
  | "flipHorizontal"
  | "flipVertical"
  | "viewMode"
  | "exportWithDarkMode"
  | "toggleTheme"
  | "increaseFontSize"
  | "decreaseFontSize"
  | "unbindText"
  | "hyperlink"
  | "bindText"
  | "unlockAllLayers"
  | "toggleLayerLock"
  | "toggleLinearEditor"
  | "toggleEraserTool"
  | "toggleHandTool"
  | "selectAllLayersInFrame"
  | "removeAllLayersFromFrame"
  | "updateFrameRendering"
  | "setFrameAsActiveTool"
  | "createContainerFromText"
  | "wrapTextInContainer";

export type PanelComponentProps = {
  appProps: ExcalidrawProps;
  appState: AppState;
  data?: Record<string, any>;
  layers: readonly ExcalidrawLayer[];
  updateData: (formData?: any) => void;
};

export interface Action {
  PanelComponent?: React.FC<PanelComponentProps>;
  checked?: (appState: Readonly<AppState>) => boolean;
  contextItemLabel?:
    | string
    | ((
        layers: readonly ExcalidrawLayer[],
        appState: Readonly<AppState>
      ) => string);
  keyPriority?: number;
  keyTest?: (
    event: React.KeyboardEvent | KeyboardEvent,
    appState: AppState,
    layers: readonly ExcalidrawLayer[]
  ) => boolean;
  name: ActionName;
  perform: ActionFn;
  predicate?: (
    layers: readonly ExcalidrawLayer[],
    appState: AppState,
    appProps: ExcalidrawProps,
    app: AppClassProperties
  ) => boolean;
  trackEvent:
    | false
    | {
        action?: string;
        category:
          | "toolbar"
          | "layer"
          | "canvas"
          | "export"
          | "history"
          | "menu"
          | "collab"
          | "hyperlink";
        predicate?: (
          appState: Readonly<AppState>,
          layers: readonly ExcalidrawLayer[],
          value: any
        ) => boolean;
      };
  /** if set to `true`, allow action to be performed in viewMode.
   *  Defaults to `false` */
  viewMode?: boolean;
}
