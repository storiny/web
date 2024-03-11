import { USER_SCHEMA } from "@storiny/shared";
import { z } from "zod";

export type InviteEditorSchema = z.infer<typeof INVITE_EDITOR_SCHEMA>;

export const INVITE_EDITOR_SCHEMA = z.object({
  username: USER_SCHEMA.username
});
