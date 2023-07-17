import rough from "roughjs/bin/rough";

import { getDefaultAppState } from "../../../../core/appState";
import { DEFAULT_EXPORT_PADDING } from "../../../../core/constants";
import { distance, isOnlyExportingSingleFrame } from "../../../../core/utils";
import { BinaryFiles } from "../../../../types";
import { EditorState, NonDeletedLayer } from "../../../../types";
import {
  getCommonBounds,
  getInitializedImageLayers,
  updateImageCache
} from "../../../layer";
import { renderScene } from "../../../renderer";

/**
 * Exports the current editor state to a canvas element
 * @param layers Layers
 * @param editorState Editor state
 * @param files Binary files
 * @param exportBackground
 * @param exportPadding
 * @param viewBackgroundColor
 * @param createCanvas
 */
export const exportToCanvas = async (
  layers: readonly NonDeletedLayer[],
  editorState: EditorState,
  files: BinaryFiles,
  {
    exportBackground,
    exportPadding = DEFAULT_EXPORT_PADDING,
    viewBackgroundColor
  }: {
    exportBackground: boolean;
    exportPadding?: number;
    viewBackgroundColor: string;
  },
  createCanvas: (
    width: number,
    height: number
  ) => { canvas: HTMLCanvasElement; scale: number } = (
    width,
    height
  ): { canvas: HTMLCanvasElement; scale: number } => {
    const canvas = document.createElement("canvas");
    canvas.width = width * editorState.exportScale;
    canvas.height = height * editorState.exportScale;

    return { canvas, scale: editorState.exportScale };
  }
): Promise<HTMLCanvasElement> => {
  const [minX, minY, width, height] = getCanvasSize(layers, exportPadding);
  const { canvas, scale = 1 } = createCanvas(width, height);
  const defaultAppState = getDefaultAppState();
  const { imageCache } = await updateImageCache({
    imageCache: new Map(),
    fileIds: getInitializedImageLayers(layers).map((layer) => layer.fileId),
    files
  });
  const onlyExportingSingleFrame = isOnlyExportingSingleFrame(layers);

  renderScene({
    layers,
    editorState,
    scale,
    rc: rough.canvas(canvas),
    canvas,
    renderConfig: {
      viewBackgroundColor: exportBackground ? viewBackgroundColor : null,
      scrollX: -minX + (onlyExportingSingleFrame ? 0 : exportPadding),
      scrollY: -minY + (onlyExportingSingleFrame ? 0 : exportPadding),
      zoom: defaultAppState.zoom,
      remotePointerViewportCoords: {},
      remoteSelectedLayerIds: {},
      shouldCacheIgnoreZoom: false,
      remotePointerUsernames: {},
      remotePointerUserStates: {},
      imageCache,
      renderScrollbars: false,
      renderSelection: false,
      renderGrid: false,
      isExporting: true
    }
  });

  return canvas;
};
