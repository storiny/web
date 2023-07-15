import { ExcalidrawTextLayer } from "../../core/layer/types";
import { AppClassProperties, AppState } from "../../core/types";

export type RenderConfig = {
  // extra options passed to the renderer
  // ---------------------------------------------------------------------------
  imageCache: AppClassProperties["imageCache"];
  /** when exporting the behavior is slightly different (e.g. we can't use
    CSS filters), and we disable render optimizations for best output */
  isExporting: boolean;
  remotePointerButton?: { [id: string]: string | undefined };
  remotePointerUserStates: { [id: string]: string };
  remotePointerUsernames: { [id: string]: string };
  // collab-related state
  // ---------------------------------------------------------------------------
  remotePointerViewportCoords: { [id: string]: { x: number; y: number } };
  remoteSelectedLayerIds: { [layerId: string]: string[] };
  renderGrid?: boolean;
  renderScrollbars?: boolean;
  renderSelection?: boolean;
  // AppState values
  // ---------------------------------------------------------------------------
  scrollX: AppState["scrollX"];
  scrollY: AppState["scrollY"];
  selectionColor?: string;
  shouldCacheIgnoreZoom: AppState["shouldCacheIgnoreZoom"];
  theme: AppState["theme"];
  /** null indicates transparent bg */
  viewBackgroundColor: AppState["viewBackgroundColor"] | null;
  zoom: AppState["zoom"];
};

export type SceneScroll = {
  scrollX: number;
  scrollY: number;
};

export interface Scene {
  layers: ExcalidrawTextLayer[];
}

export type ExportType =
  | "png"
  | "clipboard"
  | "clipboard-svg"
  | "backend"
  | "svg";

export type ScrollBars = {
  horizontal: {
    height: number;
    width: number;
    x: number;
    y: number;
  } | null;
  vertical: {
    height: number;
    width: number;
    x: number;
    y: number;
  } | null;
};
