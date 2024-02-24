import { USER_SCHEMA } from "@storiny/shared";
import { z } from "zod";

export type SignupWPMSchema = z.infer<typeof SIGNUP_WPM_SCHEMA>;

export const SIGNUP_WPM_SCHEMA = z.object({
  wpm: USER_SCHEMA.wpm
});
