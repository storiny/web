import { USER_SCHEMA } from "@storiny/shared";
import { z } from "zod";

export type AccountGeneralSchema = z.infer<typeof ACCOUNT_GENERAL_SCHEMA>;

export const ACCOUNT_GENERAL_SCHEMA = z.object({
  name: USER_SCHEMA.name,
  bio: USER_SCHEMA.bio,
  location: USER_SCHEMA.location
});
