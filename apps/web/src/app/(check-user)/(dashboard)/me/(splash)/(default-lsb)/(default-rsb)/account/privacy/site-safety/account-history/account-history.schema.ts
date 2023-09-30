import { z } from "zod";

export type AccountHistorySchema = z.infer<typeof ACCOUNT_HISTORY_SCHEMA>;

export const ACCOUNT_HISTORY_SCHEMA = z.object({
  read_history: z.boolean()
});
