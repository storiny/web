export enum ImageMime {
  AVIF = "image/avif",
  BMP = "image/bmp",
  GIF = "image/gif",
  ICO = "image/x-icon",
  JFIF = "image/jfif",
  JPG = "image/jpeg",
  PNG = "image/png",
  SVG = "image/svg+xml",
  WEBP = "image/webp"
}

export enum NonImageMime {
  // Binary
  BINARY = "application/octet-stream",
  // Excalidraw data
  EXCALIDRAW = "application/vnd.excalidraw+json",
  EXCALIDRAW_PNG = "image/png",
  // Image-encoded excalidraw data
  EXCALIDRAW_SVG = "image/svg+xml",
  JSON = "application/json"
}

export type Mime = ImageMime | NonImageMime;
// eslint-disable-next-line no-redeclare
export const Mime = Object.assign({}, ImageMime, NonImageMime);
