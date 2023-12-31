/**
 * Downloads contents as a file
 * @param data_or_blob Data or blob
 * @param filename Filename
 * @param mime File mime type
 */
export const download_as_file = (
  // eslint-disable-next-line no-undef
  data_or_blob: Blob | BlobPart,
  filename: string,
  mime?: string
): void => {
  const blob =
    data_or_blob instanceof Blob
      ? data_or_blob
      : new Blob([data_or_blob], { type: mime });
  const blob_url =
    window.URL && window.URL.createObjectURL
      ? window.URL.createObjectURL(blob)
      : window.webkitURL.createObjectURL(blob);
  const temp_link = document.createElement("a");
  temp_link.style.display = "none";
  temp_link.href = blob_url;
  temp_link.setAttribute("download", filename);

  // Safari thinks `_blank` anchor are pop-ups. We only want to set `_blank`
  // target if the browser does not support the HTML5 download attribute. This
  // allows us to download files in desktop safari if pop up blocking is enabled
  if (typeof temp_link.download === "undefined") {
    temp_link.setAttribute("target", "_blank");
  }

  document.body.appendChild(temp_link);
  temp_link.click();

  // Fixes "webkit blob resource error 1"
  setTimeout(() => {
    document.body.removeChild(temp_link);
    window.URL.revokeObjectURL(blob_url);
  }, 200);
};
