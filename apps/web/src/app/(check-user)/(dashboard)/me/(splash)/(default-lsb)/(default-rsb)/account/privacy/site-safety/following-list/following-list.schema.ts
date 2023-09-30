import { RelationVisibility } from "@storiny/shared";
import { z } from "zod";

export type FollowingListSchema = z.infer<typeof FOLLOWING_LIST_SCHEMA>;

export const FOLLOWING_LIST_SCHEMA = z.object({
  following_list: z.enum([
    `${RelationVisibility.EVERYONE}`,
    `${RelationVisibility.FRIENDS}`,
    `${RelationVisibility.NONE}`
  ])
});
