import { ZOD_MESSAGES } from "@storiny/shared/src/constants/messages";
import { z } from "zod";

export type Enable2FASchema = z.infer<typeof enable2faSchema>;

export const MFA_CODE_LENGTH = 6;

export const enable2faSchema = z.object({
  code: z
    .string()
    .length(6, "Code must be exactly 6 digits")
    .nonempty(ZOD_MESSAGES.non_empty("code"))
});
