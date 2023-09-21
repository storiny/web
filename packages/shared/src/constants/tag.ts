import { z } from "zod";

import { ZOD_MESSAGES } from "./messages";

export const TAG_PROPS = {
  name: {
    maxLength: 32,
    minLength: 1
  }
} as const;

export const TAG_NAME_REGEX = new RegExp(
  `^[\\w-]{${TAG_PROPS.name.minLength},${TAG_PROPS.name.maxLength}}$`
);

export const TAG_SCHEMA = {
  name: z
    .string()
    .min(
      TAG_PROPS.name.minLength,
      ZOD_MESSAGES.min("tag name", TAG_PROPS.name.minLength)
    )
    .max(
      TAG_PROPS.name.maxLength,
      ZOD_MESSAGES.max("tag name", TAG_PROPS.name.maxLength)
    )
    .nonempty(ZOD_MESSAGES.nonEmpty("tag name"))
    .regex(TAG_NAME_REGEX, "Tag name is invalid")
} as const;
