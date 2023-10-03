import { ZOD_MESSAGES } from "@storiny/shared";
import { z } from "zod";

export type ReportSchema = z.infer<typeof REPORT_SCHEMA>;

export const REPORT_REASON_MAX_LENGTH = 1024;

export const REPORT_SCHEMA = z.object({
  type: z.string(),
  reason: z
    .string()
    .max(
      REPORT_REASON_MAX_LENGTH,
      ZOD_MESSAGES.max("reason", REPORT_REASON_MAX_LENGTH)
    )
});
