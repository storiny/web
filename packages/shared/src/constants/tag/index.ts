import { z } from "zod";

import { ZOD_MESSAGES } from "../messages";

export const TAG_PROPS = {
  name: {
    max_length: 32,
    min_length: 1
  }
} as const;

export const TAG_NAME_REGEX = new RegExp(
  `^[\\w-]{${TAG_PROPS.name.min_length},${TAG_PROPS.name.max_length}}$`
);

export const TAG_SCHEMA = {
  name: z
    .string()
    .min(
      TAG_PROPS.name.min_length,
      ZOD_MESSAGES.min("tag name", TAG_PROPS.name.min_length)
    )
    .max(
      TAG_PROPS.name.max_length,
      ZOD_MESSAGES.max("tag name", TAG_PROPS.name.max_length)
    )
    .nonempty(ZOD_MESSAGES.non_empty("tag name"))
    .regex(TAG_NAME_REGEX, "Tag name is invalid")
} as const;
