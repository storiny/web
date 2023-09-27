import { ContentType } from "@storiny/shared";
import { FriendRequestsSchema } from "@storiny/web/src/app/(check-user)/(dashboard)/me/(splash)/(default-lsb)/(default-rsb)/account/privacy/site-safety/friend-requests";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "me/settings/privacy/incoming-friend-requests";

export type IncomingFriendRequestsPayload = FriendRequestsSchema;

export const {
  // eslint-disable-next-line prefer-snakecase/prefer-snakecase
  useIncomingFriendRequestsMutation: use_incoming_friend_requests_mutation
} = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    incomingFriendRequests: builder.mutation<
      void,
      IncomingFriendRequestsPayload
    >({
      query: (body) => ({
        url: `/${SEGMENT}`,
        method: "PATCH",
        body,
        headers: {
          "Content-type": ContentType.JSON
        }
      })
    })
  })
});
