import { BinaryFiles, EditorState, Layer } from "../../../types";
import { getNonDeletedLayers } from "../../layer";
import { getFileHandleType, isImageFileHandleType } from "../blob";
import { exportCanvas } from "../export";

export const resaveAsImageWithScene = async (
  layers: readonly Layer[],
  editorState: EditorState,
  files: BinaryFiles
  // eslint-disable-next-line no-undef
): Promise<{ fileHandle: FileSystemHandle }> => {
  const { viewBackgroundColor, name, fileHandle } = editorState;
  const fileHandleType = getFileHandleType(fileHandle);

  if (!fileHandle || !isImageFileHandleType(fileHandleType)) {
    throw new Error(
      "`fileHandle` should exist and should be of type svg or png when resaving"
    );
  }

  await exportCanvas({
    layers: getNonDeletedLayers(layers),
    editorState,
    files,
    viewBackgroundColor,
    exportBackground: true,
    name,
    fileHandle
  });

  return { fileHandle };
};
