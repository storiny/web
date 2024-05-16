import { RSB_ITEM_SCHEMA, ZOD_MESSAGES } from "@storiny/shared";
import { z } from "zod";

export type RsbSettingsSchema = z.infer<typeof RSB_SETTINGS_SCHEMA>;

export const RSB_SETTINGS_SCHEMA = z.object({
  items: z.array(z.object(RSB_ITEM_SCHEMA)),
  label: z.string().max(32, ZOD_MESSAGES.max("label", 32)).or(z.literal(""))
});
