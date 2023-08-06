import { Canvas } from "fabric";
import { decompressFromUint8Array } from "lz-string";
import { inflate } from "pako";

import { recoverObject } from "../recoverObject";

/**
 * Imports the contents from a file and renders them to
 * the canvas
 * @param canvas Canvas
 * @param data File data as array buffer
 */
export const importFromFile = (canvas: Canvas, data: Uint8Array): void => {
  const decompressed = decompressFromUint8Array(inflate(data));
  const json = JSON.parse(decompressed);

  canvas
    .loadFromJSON(json, (prop, object) => {
      recoverObject(object, prop);
      object.set({
        id: prop.id,
        name: prop.name,
        seed: prop.seed
      });
    })
    .then(() => canvas.renderAll());
};
