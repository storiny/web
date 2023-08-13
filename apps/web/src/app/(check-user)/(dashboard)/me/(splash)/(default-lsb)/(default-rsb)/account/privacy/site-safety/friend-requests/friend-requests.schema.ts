import { IncomingFriendRequest } from "@storiny/shared";
import { z } from "zod";

export type FriendRequestsSchema = z.infer<typeof friendRequestsSchema>;

export const friendRequestsSchema = z.object({
  "friend-requests": z.enum([
    `${IncomingFriendRequest.EVERYONE}`,
    `${IncomingFriendRequest.FOLLOWING}`,
    `${IncomingFriendRequest.FOF}`,
    `${IncomingFriendRequest.NONE}`
  ])
});
