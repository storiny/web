// Valid image widths for generating CDN url.
export enum ImageSize {
  W_24 = 24,
  W_32 = 32,
  W_64 = 64,
  W_128 = 128,
  W_256 = 256,
  W_320 = 320,
  W_640 = 640,
  W_860 = 860,
  W_1024 = 1024,
  W_1440 = 1440,
  W_1920 = 1920,
  W_2048 = 2048,
}

export type TImageSize = `${Extract<
  ImageSize,
  number
>}` extends `${infer N extends number}`
  ? N
  : never;
