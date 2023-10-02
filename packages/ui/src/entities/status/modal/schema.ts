import { StatusDuration, StatusVisibility, USER_SCHEMA } from "@storiny/shared";
import { z } from "zod";
export type SetStatusSchema = z.infer<typeof SET_STATUS_SCHEMA>;

export const SET_STATUS_SCHEMA = z.object({
  duration: z.nativeEnum(StatusDuration),
  visibility: z.nativeEnum(StatusVisibility),
  status_text: USER_SCHEMA.status_text,
  status_emoji: z.string().nullable()
});
