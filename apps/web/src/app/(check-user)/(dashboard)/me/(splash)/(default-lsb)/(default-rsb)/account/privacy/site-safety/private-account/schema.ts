import { z } from "zod";

export type PrivateAccountSchema = z.infer<typeof privateAccountSchema>;

export const privateAccountSchema = z.object({
  "private-account": z.boolean()
});
