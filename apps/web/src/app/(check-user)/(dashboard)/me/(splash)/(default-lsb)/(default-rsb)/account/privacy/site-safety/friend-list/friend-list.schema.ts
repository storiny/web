import { RelationVisibility } from "@storiny/shared";
import { z } from "zod";

export type FriendListSchema = z.infer<typeof friendListSchema>;

export const friendListSchema = z.object({
  "friend-list": z.enum([
    `${RelationVisibility.EVERYONE}`,
    `${RelationVisibility.FRIENDS}`,
    `${RelationVisibility.NONE}`
  ])
});
