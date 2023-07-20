import { MarkOptional } from "@storiny/types";
import React from "react";

import {
  BinaryFiles,
  EditorClassProperties,
  EditorState,
  Layer
} from "../../types";

export type ActionSource = "ui" | "keyboard" | "contextMenu" | "api";

/** if false, the action should be prevented */
export type ActionResult =
  | {
      commitToHistory: boolean;
      editorState?: MarkOptional<
        EditorState,
        "offsetTop" | "offsetLeft" | "width" | "height"
      > | null;
      files?: BinaryFiles | null;
      layers?: Layer[] | null;
      replaceFiles?: boolean;
      syncHistory?: boolean;
    }
  | false;

type ActionFn = (
  layers: Layer[],
  editorState: Readonly<EditorState>,
  formData: any,
  app: EditorClassProperties
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
  data?: Record<string, any>;
  editorState: EditorState;
  layers: Layer[];
  updateData: (formData?: any) => void;
};

export interface Action {
  PanelComponent?: React.FC<PanelComponentProps>;
  checked?: (editorState: Readonly<EditorState>) => boolean;
  contextItemLabel?:
    | string
    | ((layers: Layer[], editorState: Readonly<EditorState>) => string);
  keyPriority?: number;
  keyTest?: (
    event: React.KeyboardEvent | KeyboardEvent,
    editorState: EditorState,
    layers: Layer[]
  ) => boolean;
  name: ActionName;
  perform: ActionFn;
  predicate?: (layers: Layer[], editorState: EditorState) => boolean;
}
