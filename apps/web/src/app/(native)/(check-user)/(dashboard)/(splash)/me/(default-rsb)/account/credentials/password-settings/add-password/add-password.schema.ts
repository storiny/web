import { USER_SCHEMA } from "@storiny/shared";
import { ZOD_MESSAGES } from "@storiny/shared/src/constants/messages";
import { z } from "zod";

export type AddPasswordSchema = z.infer<typeof ADD_PASSWORD_SCHEMA>;

export const VERIFICATION_CODE_LENGTH = 6;

export const ADD_PASSWORD_SCHEMA = z.object({
  verification_code: z
    .string()
    .length(VERIFICATION_CODE_LENGTH, "Invalid verification code")
    .nonempty(ZOD_MESSAGES.non_empty("verification code")),
  new_password: USER_SCHEMA.password
});
