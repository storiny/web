import { ContentType } from "@storiny/shared";
import { FollowingListSchema } from "@storiny/web/src/app/(native)/(check-user)/(dashboard)/(splash)/me/(default-rsb)/account/privacy/site-safety/following-list";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "me/settings/privacy/following-list";

export type FollowingListSettingsPayload = FollowingListSchema;

export const { useFollowingListMutation: use_following_list_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      followingList: builder.mutation<void, FollowingListSettingsPayload>({
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
