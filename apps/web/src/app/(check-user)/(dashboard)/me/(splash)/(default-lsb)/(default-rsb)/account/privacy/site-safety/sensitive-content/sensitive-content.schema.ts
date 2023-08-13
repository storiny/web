import { z } from "zod";

export type SensitiveContentSchema = z.infer<typeof sensitiveContentSchema>;

export const sensitiveContentSchema = z.object({
  "sensitive-content": z.boolean()
});
