import { z } from "zod";

export type EmbedSchema = z.infer<typeof EMBED_SCHEMA>;

export const EMBED_SCHEMA = z.object({
  url: z.string().url("Invalid URL").min(1, "URL must not be empty")
});
