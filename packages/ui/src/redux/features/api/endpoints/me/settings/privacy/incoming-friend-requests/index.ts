import { ContentType } from "@storiny/shared";
import { FriendRequestsSchema } from "@storiny/web/src/app/(check-user)/(dashboard)/me/(splash)/(default-lsb)/(default-rsb)/account/privacy/site-safety/friend-requests";

import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = "me/settings/privacy/incoming-friend-requests";

export interface IncomingFriendRequestsResponse {}
export type IncomingFriendRequestsPayload = FriendRequestsSchema;

export const { useIncomingFriendRequestsMutation } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    incomingFriendRequests: builder.mutation<
      IncomingFriendRequestsResponse,
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
