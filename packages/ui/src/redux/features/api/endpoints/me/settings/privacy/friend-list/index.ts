import { ContentType } from "@storiny/shared";
import { FriendListSchema } from "@storiny/web/src/app/(native)/(check-user)/(dashboard)/(splash)/me/(default-rsb)/account/privacy/site-safety/friend-list";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "me/settings/privacy/friend-list";

export type FriendListSettingsPayload = FriendListSchema;

export const { useFriendListMutation: use_friend_list_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      friendList: builder.mutation<void, FriendListSettingsPayload>({
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
