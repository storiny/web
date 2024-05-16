import { USER_SCHEMA } from "@storiny/shared";
import { z } from "zod";

export type InviteWriterSchema = z.infer<typeof INVITE_WRITER_SCHEMA>;

export const INVITE_WRITER_SCHEMA = z.object({
  username: USER_SCHEMA.username
});
