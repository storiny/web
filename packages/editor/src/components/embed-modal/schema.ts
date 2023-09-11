import { z } from "zod";

export type EmbedSchema = z.infer<typeof embedSchema>;

export const embedSchema = z.object({
  url: z.string().url("Invalid URL").nonempty("URL must not be empty")
});
