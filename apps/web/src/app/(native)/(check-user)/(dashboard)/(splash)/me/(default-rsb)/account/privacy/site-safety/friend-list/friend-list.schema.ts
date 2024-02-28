import { RelationVisibility } from "@storiny/shared";
import { z } from "zod";

export type FriendListSchema = z.infer<typeof FRIEND_LIST_SCHEMA>;

export const FRIEND_LIST_SCHEMA = z.object({
  friend_list: z.enum([
    `${RelationVisibility.EVERYONE}`,
    `${RelationVisibility.FRIENDS}`,
    `${RelationVisibility.NONE}`
  ])
});
