import { USER_SCHEMA } from "@storiny/shared";
import { z } from "zod";

export type SignupWPMSchema = z.infer<typeof signupWPMSchema>;

export const signupWPMSchema = z.object({
  wpm: USER_SCHEMA.wpm
});
