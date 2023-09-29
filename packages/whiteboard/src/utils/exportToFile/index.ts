import { downloadAsFile } from "../../../../shared/src/utils/download-as-file";
import { Canvas } from "fabric";
import { compressToUint8Array } from "lz-string";
import { deflate } from "pako";

import {
  FILE_EXTENSIONS,
  FILE_MIME_TYPE,
  recoveryKeys,
  WHITEBOARD_VERSION
} from "../../constants";

const DATA_SOURCE = "storiny-sketch";

/**
 * Returns the name of the file to export
 */
const getFilename = (): string =>
  `Sketch-${new Date().toJSON()}.${FILE_EXTENSIONS[0]}`;

/**
 * Exports the contents of the canvas to a file
 * @param canvas Canvas
 */
export const exportToFile = (canvas: Canvas): void => {
  const data = canvas.toDatalessJSON(recoveryKeys);

  delete data.width;
  delete data.height;

  data.version = WHITEBOARD_VERSION;
  data.source = DATA_SOURCE;
  data.exportedAt = new Date().toJSON();

  const arrayBuffer = compressToUint8Array(JSON.stringify(data));
  const compressed = deflate(arrayBuffer);

  downloadAsFile(compressed, getFilename(), FILE_MIME_TYPE);
};
