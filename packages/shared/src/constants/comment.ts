import { z } from "zod";

import { ZOD_MESSAGES } from "./messages";

export const commentProps = {
  content: {
    maxLength: 2048,
    minLength: 1
  }
} as const;

export const commentSchema = {
  content: z
    .string()
    .min(
      commentProps.content.minLength,
      ZOD_MESSAGES.min("content", commentProps.content.minLength)
    )
    .max(
      commentProps.content.maxLength,
      ZOD_MESSAGES.max("content", commentProps.content.maxLength)
    )
    .nonempty(ZOD_MESSAGES.nonEmpty("content"))
} as const;
