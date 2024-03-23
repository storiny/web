import { z } from "zod";

export type PrivateAccountSchema = z.infer<typeof PRIVATE_ACCOUNT_SCHEMA>;

export const PRIVATE_ACCOUNT_SCHEMA = z.object({
  private_account: z.boolean()
});
