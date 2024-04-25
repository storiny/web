import { ZOD_MESSAGES } from "@storiny/shared/src/constants/messages";
import { z } from "zod";

export type Enable2FASchema = z.infer<typeof ENABLE_2FA_SCHEMA>;

export const MFA_CODE_LENGTH = 6;

export const ENABLE_2FA_SCHEMA = z.object({
  code: z
    .string()
    .min(1, ZOD_MESSAGES.non_empty("code"))
    .length(6, "Code must be exactly 6 digits")
});
