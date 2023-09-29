import { USER_SCHEMA } from "@storiny/shared";
import { z } from "zod";

export type ExportDataSchema = z.infer<typeof exportDataSchema>;

export const exportDataSchema = z.object({
  "current-password": USER_SCHEMA.password
});
