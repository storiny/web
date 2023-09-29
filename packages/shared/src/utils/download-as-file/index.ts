/**
 * Downloads contents as a file
 * @param dataOrBlob Data or blob
 * @param filename Filename
 * @param mime File mime type
 */
export const downloadAsFile = (
  // eslint-disable-next-line no-undef
  dataOrBlob: Blob | BlobPart,
  filename: string,
  mime?: string
): void => {
  const blob =
    dataOrBlob instanceof Blob
      ? dataOrBlob
      : new Blob([dataOrBlob], { type: mime });
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
