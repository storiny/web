import { ContentType } from "@storiny/shared";
import { FollowingListSchema } from "@storiny/web/src/app/(check-user)/(dashboard)/me/(splash)/(default-lsb)/(default-rsb)/account/privacy/site-safety/following-list";

import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = "me/settings/privacy/following-list";

export interface FollowingListSettingsResponse {}
export type FollowingListSettingsPayload = FollowingListSchema;

export const { useFollowingListMutation } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    followingList: builder.mutation<
      FollowingListSettingsResponse,
      FollowingListSettingsPayload
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
