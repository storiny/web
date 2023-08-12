import { RelationVisibility } from "@storiny/shared";
import { z } from "zod";

export type FriendRequestsSchema = z.infer<typeof friendRequestsSchema>;

export const friendRequestsSchema = z.object({
  "friend-requests": z.enum([
    `${RelationVisibility.NONE}`,
    `${RelationVisibility.FRIENDS}`,
    `${RelationVisibility.EVERYONE}`
  ])
});
