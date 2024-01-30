import { Canvas } from "fabric";
import { decompressFromUint8Array as decompress_from_uint8_array } from "lz-string";
import { inflate } from "pako";

import { recover_object } from "../recover-object";

/**
 * Imports the contents from a file and renders them to
 * the canvas
 * @param canvas Canvas
 * @param data File data as array buffer
 */
export const import_from_file = (canvas: Canvas, data: Uint8Array): void => {
  const decompressed = decompress_from_uint8_array(inflate(data));
  const json = JSON.parse(decompressed);

  canvas
    .loadFromJSON(json, (prop, object) => {
      recover_object(object, prop);

      if ("set" in object) {
        object.set({
          id: prop.id,
          name: prop.name,
          seed: prop.seed
        });
      }
    })
    .then(() => canvas.renderAll());
};
