import { ZOD_MESSAGES } from "@storiny/shared";
import { z } from "zod";

export type AlphaSchema = z.infer<typeof ALPHA_SCHEMA>;

export const ALPHA_SCHEMA = z.object({
  alpha_invite_code: z
    .string()
    .min(8, ZOD_MESSAGES.min("invite code", 8))
    .max(12, ZOD_MESSAGES.max("invite code", 12))
    .nonempty(ZOD_MESSAGES.non_empty("invite code"))
});
