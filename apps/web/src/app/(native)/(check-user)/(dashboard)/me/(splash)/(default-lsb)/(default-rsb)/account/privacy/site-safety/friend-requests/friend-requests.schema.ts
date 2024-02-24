import { IncomingFriendRequest } from "@storiny/shared";
import { z } from "zod";

export type FriendRequestsSchema = z.infer<typeof FRIEND_REQUESTS_SCHEMA>;

export const FRIEND_REQUESTS_SCHEMA = z.object({
  friend_requests: z.enum([
    `${IncomingFriendRequest.EVERYONE}`,
    `${IncomingFriendRequest.FOLLOWING}`,
    `${IncomingFriendRequest.FOF}`,
    `${IncomingFriendRequest.NONE}`
  ])
});
