import { NonImageMime } from "../../../constants";
import { EXPORT_DATA_TYPES, EXPORT_SOURCE } from "../../../constants/new";
import {
  BinaryFiles,
  EditorState,
  ExportedDataState,
  ImportedDataState,
  Layer,
  RootState
} from "../../../types";
import { cleanEditorStateForExport } from "../../state";
import { isImageFileHandle, loadFromBlob, normalizeFile } from "../blob";
import { clearLayersForExport } from "../export";
import { fileOpen, fileSave } from "../fs";
import { RestoredDataState } from "../restore";

/**
 * Strips out files which are only referenced by deleted layers
 * @param layers Input layers
 * @param files Binary files
 */
const filterOutDeletedFiles = (
  layers: readonly Layer[],
  files: BinaryFiles
): BinaryFiles => {
  const nextFiles: BinaryFiles = {};

  for (const layer of layers) {
    if (
      !layer.isDeleted &&
      "fileId" in layer &&
      layer.fileId &&
      files[layer.fileId]
    ) {
      nextFiles[layer.fileId] = files[layer.fileId];
    }
  }

  return nextFiles;
};

/**
 * Serializes editor state to JSON
 * @param layers Layers
 * @param editorState Editor state
 * @param files Files
 */
export const serializeAsJSON = (
  layers: readonly Layer[],
  editorState: Partial<EditorState>,
  files: BinaryFiles
): string => {
  const data: ExportedDataState = {
    type: EXPORT_DATA_TYPES.excalidraw,
    version: 1,
    source: EXPORT_SOURCE,
    layers: clearLayersForExport(layers),
    editorState: cleanEditorStateForExport(editorState),
    files: filterOutDeletedFiles(layers, files)
  };

  return JSON.stringify(data, null, 2);
};

/**
 * Saves file as JSON
 * @param layers Layers
 * @param editorState Editor state
 * @param files Files
 */
export const saveAsJSON = async (
  layers: readonly Layer[],
  editorState: EditorState,
  files: BinaryFiles
  // eslint-disable-next-line no-undef
): Promise<{ fileHandle: FileSystemHandle | null }> => {
  const serialized = serializeAsJSON(layers, editorState, files);
  const blob = new Blob([serialized], {
    type: NonImageMime.EXCALIDRAW
  });

  const fileHandle = await fileSave(blob, {
    name: editorState.name,
    extension: "excalidraw",
    description: "Excalidraw file",
    fileHandle: isImageFileHandle(editorState.fileHandle)
      ? null
      : editorState.fileHandle
  });

  return { fileHandle };
};

/**
 * Loads data from a JSON file
 * @param localEditorState Local editor state
 * @param localLayers Layers
 */
export const loadFromJSON = async (
  localEditorState: RootState,
  localLayers: readonly Layer[] | null
): Promise<RestoredDataState> => {
  const file = await fileOpen({
    description: "Excalidraw files"
    // TODO: Be over-permissive until https://bugs.webkit.org/show_bug.cgi?id=34442
    // gets resolved. Else, iOS users cannot open `.excalidraw` files.
    // extensions: ["json", "excalidraw", "png", "svg"],
  });

  return loadFromBlob(
    await normalizeFile(file),
    localEditorState,
    localLayers,
    (file as any).handle
  );
};

/**
 * Function for validating editor data
 * @param data Editor data
 */
export const isValidEditorData = (data?: {
  editorState?: any;
  layers?: any;
  type?: any;
}): data is ImportedDataState =>
  data?.type === EXPORT_DATA_TYPES.excalidraw &&
  (!data.layers ||
    (Array.isArray(data.layers) &&
      (!data.editorState || typeof data.editorState === "object")));
