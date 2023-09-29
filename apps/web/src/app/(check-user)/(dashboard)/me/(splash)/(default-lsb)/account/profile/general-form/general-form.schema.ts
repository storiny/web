import { USER_SCHEMA } from "@storiny/shared";
import { z } from "zod";

export type AccountGeneralSchema = z.infer<typeof accountGeneralSchema>;

export const accountGeneralSchema = z.object({
  name: USER_SCHEMA.name,
  bio: USER_SCHEMA.bio,
  location: USER_SCHEMA.location
});
