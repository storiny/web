import { EditorClassProperties, RootState, TextLayer } from "../../../types";

export interface RenderConfig {
  imageCache: EditorClassProperties["imageCache"];
  /**
   * When exporting, the behavior is slightly different (e.g., we cannot
   * use CSS filters), and we disable render optimizations for the best output
   */
  isExporting: boolean;
  // remotePointerButton?: { [id: string]: string | undefined };
  // remotePointerUserStates: { [id: string]: string };
  // remotePointerUsernames: { [id: string]: string };
  // // collab-related state
  // // ---------------------------------------------------------------------------
  // remotePointerViewportCoords: { [id: string]: { x: number; y: number } };
  // remoteSelectedLayerIds: { [layerId: string]: string[] };
  renderGrid?: boolean;
  renderScrollbars?: boolean;
  renderSelection?: boolean;
  scrollX: RootState["scrollX"];
  scrollY: RootState["scrollY"];
  selectionColor?: string;
  shouldCacheIgnoreZoom: RootState["shouldCacheIgnoreZoom"];
  viewBackgroundColor: RootState["viewBackgroundColor"] | null; // null indicates transparent
  zoom: RootState["zoom"];
}

export interface SceneScroll {
  scrollX: number;
  scrollY: number;
}

export interface TScene {
  layers: TextLayer[];
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
