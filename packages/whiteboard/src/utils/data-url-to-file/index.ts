/**
 * Converts data url to a file
 * @param data_url Data URL
 * @param filename filename
 */
export const data_url_to_file = (data_url: string, filename = ""): File => {
  const data_index_start = data_url.indexOf(",");
  const byte_string = atob(data_url.slice(data_index_start + 1));
  const mime_type = data_url
    .slice(0, data_index_start)
    .split(":")[1]
    .split(";")[0];
  const ab = new ArrayBuffer(byte_string.length);
  const ia = new Uint8Array(ab);

  for (let i = 0; i < byte_string.length; i++) {
    ia[i] = byte_string.charCodeAt(i);
  }

  return new File([ab], filename, { type: mime_type });
};
