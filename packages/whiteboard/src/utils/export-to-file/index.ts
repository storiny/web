import { download_as_file } from "@storiny/shared/src/utils/download-as-file";
import { Canvas } from "fabric";
import { compressToUint8Array as compress_to_uint8_array } from "lz-string";
import { deflate } from "pako";

import {
  FILE_EXTENSIONS,
  FILE_MIME_TYPE,
  RECOVERY_KEYS,
  WHITEBOARD_VERSION
} from "../../constants";

const DATA_SOURCE = "storiny-sketch";

/**
 * Returns the name of the file to export
 */
const get_filename = (): string =>
  `Sketch-${new Date().toJSON()}.${FILE_EXTENSIONS[0]}`;

/**
 * Exports the contents of the canvas to a file
 * @param canvas Canvas
 */
export const export_to_file = (canvas: Canvas): void => {
  const data = canvas.toDatalessJSON(RECOVERY_KEYS);

  delete data.width;
  delete data.height;

  data.version = WHITEBOARD_VERSION;
  data.source = DATA_SOURCE;
  data.exportedAt = new Date().toJSON();

  const array_buffer = compress_to_uint8_array(JSON.stringify(data));
  const compressed = deflate(array_buffer);

  download_as_file(compressed, get_filename(), FILE_MIME_TYPE);
};
