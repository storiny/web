import { DEFAULT_EXPORT_PADDING } from "../../../constants";
import {
  BinaryFiles,
  EditorState,
  Layer,
  NonDeletedLayer
} from "../../../types";
import { getNonDeletedLayers, isLinearLayerType } from "../../layer";
import { exportToCanvas } from "../../scene";
import { canvasToBlob } from "../blob";
import { fileSave } from "../fs";

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
 * @param exportBackground Export background
 * @param exportPadding Export padding
 * @param viewBackgroundColor View background color
 * @param name File name
 * @param fileHandle File handle
 */
export const exportCanvas = async ({
  layers,
  editorState,
  files,
  exportBackground,
  exportPadding = DEFAULT_EXPORT_PADDING,
  viewBackgroundColor,
  name,
  fileHandle = null
}: {
  editorState: EditorState;
  exportBackground: boolean;
  exportPadding?: number;
  // eslint-disable-next-line no-undef
  fileHandle?: FileSystemHandle | null;
  files: BinaryFiles;
  layers: readonly NonDeletedLayer[];
  name: string;
  viewBackgroundColor: string;
}): // eslint-disable-next-line no-undef
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
