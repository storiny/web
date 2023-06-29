import { ImageSize } from "@storiny/shared";

const validSizes = Object.values(ImageSize)
  .filter((value) => typeof value === "number")
  .join("|");

export const NATIVE_REGEX = new RegExp(
  `\\/(?:(uploads|dl)\\/)?(?:(w@(?:auto|${validSizes}))\\/)?((?!uploads|dl)[\\/a-zA-Z0-9_-]+)$`
);

export const REMOTE_REGEX = new RegExp(
  `\\/remote\\/(?:(w@(?:auto|${validSizes}))\\/)?([a-zA-Z0-9_-]+)\\/([a-zA-Z0-9_-]+)$`
);
