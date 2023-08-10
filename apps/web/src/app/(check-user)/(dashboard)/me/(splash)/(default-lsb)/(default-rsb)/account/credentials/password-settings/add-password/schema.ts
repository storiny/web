import { userSchema } from "@storiny/shared";
import { zodMessages } from "@storiny/shared/src/constants/messages";
import { z } from "zod";

export type AddPasswordSchema = z.infer<typeof addPasswordSchema>;

export const VERIFICATION_CODE_MIN_LENGTH = 1;
export const VERIFICATION_CODE_MAX_LENGTH = 96;

export const addPasswordSchema = z.object({
  "verification-code": z
    .string()
    .min(
      VERIFICATION_CODE_MIN_LENGTH,
      zodMessages.min("verification code", VERIFICATION_CODE_MIN_LENGTH)
    )
    .max(
      VERIFICATION_CODE_MAX_LENGTH,
      zodMessages.max("verification code", VERIFICATION_CODE_MAX_LENGTH)
    )
    .nonempty(zodMessages.nonEmpty("verification code")),
  "new-password": userSchema.password
});
