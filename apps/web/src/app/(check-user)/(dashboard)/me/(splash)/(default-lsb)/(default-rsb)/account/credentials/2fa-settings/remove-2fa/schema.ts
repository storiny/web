import { zodMessages } from "@storiny/shared/src/constants/messages";
import { z } from "zod";

export type Remove2FASchema = z.infer<typeof remove2faSchema>;

export const RECOVERY_CODE_MIN_LENGTH = 6;
export const RECOVERY_CODE_MAX_LENGTH = 8;

export const remove2faSchema = z.object({
  code: z
    .string()
    .min(
      RECOVERY_CODE_MIN_LENGTH,
      zodMessages.min("code", RECOVERY_CODE_MIN_LENGTH)
    )
    .max(
      RECOVERY_CODE_MAX_LENGTH,
      zodMessages.max("code", RECOVERY_CODE_MAX_LENGTH)
    )
    .nonempty(zodMessages.nonEmpty("code"))
});
