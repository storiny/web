import { ContentType } from "@storiny/shared";
import { FriendListSchema } from "@storiny/web/src/app/(check-user)/(dashboard)/me/(splash)/(default-lsb)/(default-rsb)/account/privacy/site-safety/friend-list";

import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = "me/settings/privacy/friend-list";

export interface FriendListSettingsResponse {}
export type FriendListSettingsPayload = FriendListSchema;

export const { useFriendListMutation } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    friendList: builder.mutation<
      FriendListSettingsResponse,
      FriendListSettingsPayload
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
