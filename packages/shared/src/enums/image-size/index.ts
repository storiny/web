// `ImageSize` is also used by @storiny/cdn. Changes made in this file must be
// mirrored to the @storiny/cdn repository manually.

// Valid image widths for generating CDN url
export enum ImageSize {
  W_64 /*  */ = 64,
  W_128 /* */ = 128,
  W_320 /* */ = 320,
  W_640 /* */ = 640,
  W_960 /* */ = 960,
  W_1200 /**/ = 1200,
  W_1440 /**/ = 1440,
  W_1920 /**/ = 1920,
  W_2440 /**/ = 2440
}

export type TImageSize = `${Extract<
  ImageSize,
  number
>}` extends `${infer N extends number}`
  ? N
  : never;
