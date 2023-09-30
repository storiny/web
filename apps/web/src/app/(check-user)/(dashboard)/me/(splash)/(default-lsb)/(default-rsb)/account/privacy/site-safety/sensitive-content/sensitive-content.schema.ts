import { z } from "zod";

export type SensitiveContentSchema = z.infer<typeof SENSITIVE_CONTENT_SCHEMA>;

export const SENSITIVE_CONTENT_SCHEMA = z.object({
  sensitive_content: z.boolean()
});
