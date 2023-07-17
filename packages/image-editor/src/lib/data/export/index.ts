import { DEFAULT_EXPORT_PADDING } from "../../../core/constants";
import {
  BinaryFiles,
  EditorState,
  Layer,
  NonDeletedLayer
} from "../../../types";
import { getNonDeletedLayers, isLinearLayerType } from "../../layer";
import { exportToCanvas } from "../../scene/export/export";
import { canvasToBlob } from "../blob";
import { fileSave, FileSystemHandle } from "../fs";

/**
 * Cleans up layers for exporting
 * @param layers Layers to clean
 */
export const clearLayersForExport = (layers: readonly Layer[]): Layer[] =>
  getNonDeletedLayers(layers).map((layer) =>
    isLinearLayerType(layer.type)
      ? { ...layer, lastCommittedPoint: null }
      : layer
  );

/**
 * Exports canvas to PNG
 * @param layers Layers
 * @param editorState Editor state
 * @param files Binary files
 * @param exportBackground
 * @param exportPadding
 * @param viewBackgroundColor
 * @param name
 * @param fileHandle
 */
export const exportCanvas = async (
  layers: readonly NonDeletedLayer[],
  editorState: EditorState,
  files: BinaryFiles,
  {
    exportBackground,
    exportPadding = DEFAULT_EXPORT_PADDING,
    viewBackgroundColor,
    name,
    fileHandle = null
  }: {
    exportBackground: boolean;
    exportPadding?: number;
    fileHandle?: FileSystemHandle | null;
    name: string;
    viewBackgroundColor: string;
  }
): // eslint-disable-next-line no-undef
Promise<FileSystemFileHandle | null> => {
  if (layers.length === 0) {
    throw new Error("Cannot export empty sketch");
  }

  const tempCanvas = await exportToCanvas(layers, editorState, files, {
    exportBackground,
    viewBackgroundColor,
    exportPadding
  });

  tempCanvas.style.display = "none";
  document.body.appendChild(tempCanvas);
  let blob = await canvasToBlob(tempCanvas);
  tempCanvas.remove();

  return await fileSave(blob, {
    description: "Export to PNG",
    name,
    extension: "png",
    fileHandle
  });
};
