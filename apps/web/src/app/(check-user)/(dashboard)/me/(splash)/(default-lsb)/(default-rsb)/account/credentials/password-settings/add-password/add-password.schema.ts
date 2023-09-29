import { USER_SCHEMA } from "@storiny/shared";
import { ZOD_MESSAGES } from "@storiny/shared/src/constants/messages";
import { z } from "zod";

export type AddPasswordSchema = z.infer<typeof addPasswordSchema>;

export const VERIFICATION_CODE_MIN_LENGTH = 1;
export const VERIFICATION_CODE_MAX_LENGTH = 96;

export const addPasswordSchema = z.object({
  "verification-code": z
    .string()
    .min(
      VERIFICATION_CODE_MIN_LENGTH,
      ZOD_MESSAGES.min("verification code", VERIFICATION_CODE_MIN_LENGTH)
    )
    .max(
      VERIFICATION_CODE_MAX_LENGTH,
      ZOD_MESSAGES.max("verification code", VERIFICATION_CODE_MAX_LENGTH)
    )
    .nonempty(ZOD_MESSAGES.non_empty("verification code")),
  "new-password": USER_SCHEMA.password
});
