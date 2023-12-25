import { ZOD_MESSAGES } from "@storiny/shared";
import { z } from "zod";

export type MFASchema = z.infer<typeof MFA_SCHEMA>;

export const AUTHENTICATION_CODE_MIN_LENGTH = 6;

// The actual length of the recovery code is 12 characters, but we allow the
// users to enter the code with hyphens or whitespace in between. The code is
// sanitized before it is sent to the server.
export const AUTHENTICATION_CODE_MAX_LENGTH = 20;

export const MFA_SCHEMA = z.object({
  code: z.string().min(6, ZOD_MESSAGES.min("authentication code", 6))
});
