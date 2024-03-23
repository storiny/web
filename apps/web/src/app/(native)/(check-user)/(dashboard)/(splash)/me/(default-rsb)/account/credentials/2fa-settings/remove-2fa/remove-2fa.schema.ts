import { ZOD_MESSAGES } from "@storiny/shared/src/constants/messages";
import { z } from "zod";

export type Remove2FASchema = z.infer<typeof REMOVE_2FA_SCHEMA>;

export const RECOVERY_CODE_MIN_LENGTH = 6;
export const RECOVERY_CODE_MAX_LENGTH = 12;

export const REMOVE_2FA_SCHEMA = z.object({
  code: z
    .string()
    .min(
      RECOVERY_CODE_MIN_LENGTH,
      ZOD_MESSAGES.min("code", RECOVERY_CODE_MIN_LENGTH)
    )
    .max(
      RECOVERY_CODE_MAX_LENGTH,
      ZOD_MESSAGES.max("code", RECOVERY_CODE_MAX_LENGTH)
    )
    .nonempty(ZOD_MESSAGES.non_empty("code"))
});
