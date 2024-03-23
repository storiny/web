import { USER_SCHEMA } from "@storiny/shared";
import { z } from "zod";

export type ExportDataSchema = z.infer<typeof EXPORT_DATA_SCHEMA>;

export const EXPORT_DATA_SCHEMA = z.object({
  current_password: USER_SCHEMA.password
});
