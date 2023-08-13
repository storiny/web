import { userSchema } from "@storiny/shared";
import { z } from "zod";

export type AccountGeneralSchema = z.infer<typeof accountGeneralSchema>;

export const accountGeneralSchema = z.object({
  name: userSchema.name,
  bio: userSchema.bio,
  location: userSchema.location
});
