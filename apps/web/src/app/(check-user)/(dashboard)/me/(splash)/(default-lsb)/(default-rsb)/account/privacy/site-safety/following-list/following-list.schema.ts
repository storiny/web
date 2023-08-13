import { RelationVisibility } from "@storiny/shared";
import { z } from "zod";

export type FollowingListSchema = z.infer<typeof followingListSchema>;

export const followingListSchema = z.object({
  "following-list": z.enum([
    `${RelationVisibility.EVERYONE}`,
    `${RelationVisibility.FRIENDS}`,
    `${RelationVisibility.NONE}`
  ])
});
