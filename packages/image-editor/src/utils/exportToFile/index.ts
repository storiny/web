import { Canvas } from "fabric";
import { compressToUint8Array } from "lz-string";

import { FILE_EXTENSIONS, FILE_MIME_TYPE, recoveryKeys } from "../../constants";

/**
 * Downloads contents as a file
 * @param data Data to download
 * @param filename Filename
 */
const downloadAsFile = (data: Uint8Array, filename: string): void => {
  const blob = new Blob([data], { type: FILE_MIME_TYPE });
  const blobURL =
    window.URL && window.URL.createObjectURL
      ? window.URL.createObjectURL(blob)
      : window.webkitURL.createObjectURL(blob);
  const tempLink = document.createElement("a");
  tempLink.style.display = "none";
  tempLink.href = blobURL;
  tempLink.setAttribute("download", filename);

  // Safari thinks `_blank` anchor are pop-ups. We only want to set `_blank`
  // target if the browser does not support the HTML5 download attribute.
  // This allows us to download files in desktop safari if pop up blocking
  // is enabled
  if (typeof tempLink.download === "undefined") {
    tempLink.setAttribute("target", "_blank");
  }

  document.body.appendChild(tempLink);
  tempLink.click();

  // Fixes "webkit blob resource error 1"
  setTimeout(() => {
    document.body.removeChild(tempLink);
    window.URL.revokeObjectURL(blobURL);
  }, 200);
};

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

  downloadAsFile(compressToUint8Array(JSON.stringify(data)), getFilename());
};
