import { z } from "zod";

export type AccountHistorySchema = z.infer<typeof accountHistorySchema>;

export const accountHistorySchema = z.object({
  "read-history": z.boolean()
});
