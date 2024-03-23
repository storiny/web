import { LSB_ITEM_SCHEMA } from "@storiny/shared";
import { z } from "zod";

export type LsbSettingsSchema = z.infer<typeof LSB_SETTINGS_SCHEMA>;

export const LSB_SETTINGS_SCHEMA = z.object({
  items: z.array(z.object(LSB_ITEM_SCHEMA))
});
