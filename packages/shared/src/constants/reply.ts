import { z } from "zod";

import { ZOD_MESSAGES } from "./messages";

export const replyProps = {
  content: {
    maxLength: 1024,
    minLength: 1
  }
} as const;

export const replySchema = {
  content: z
    .string()
    .min(
      replyProps.content.minLength,
      ZOD_MESSAGES.min("content", replyProps.content.minLength)
    )
    .max(
      replyProps.content.maxLength,
      ZOD_MESSAGES.max("content", replyProps.content.maxLength)
    )
    .nonempty(ZOD_MESSAGES.nonEmpty("content"))
} as const;
