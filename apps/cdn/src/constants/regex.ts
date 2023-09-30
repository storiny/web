import { ImageSize } from "@storiny/shared/src/enums/image-size";

const VALID_SIZES = Object.values(ImageSize)
  .filter((value) => typeof value === "number")
  .join("|");

export const NATIVE_REGEX = new RegExp(
  `\\/(?:(uploads|dl)\\/)?(?:(w@(?:auto|${VALID_SIZES}))\\/)?((?!uploads|dl)[\\/a-zA-Z0-9._-]+)$`
);

export const REMOTE_REGEX = new RegExp(
  `\\/remote\\/(?:(w@(?:auto|${VALID_SIZES}))\\/)?([a-zA-Z0-9_-]+)\\/([a-zA-Z0-9._-]+)$`
);
