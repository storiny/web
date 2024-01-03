import { ZOD_MESSAGES } from "@storiny/shared";
import { z } from "zod";

export type CodeBlockTitleSchema = z.infer<typeof CODE_BLOCK_TITLE_SCHEMA>;

export const CODE_BLOCK_TITLE_MAX_LENGTH = 64;

export const CODE_BLOCK_TITLE_SCHEMA = z.object({
  title: z
    .string()
    .max(
      CODE_BLOCK_TITLE_MAX_LENGTH,
      ZOD_MESSAGES.max("title", CODE_BLOCK_TITLE_MAX_LENGTH)
    )
});
