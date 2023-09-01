import { ContentType } from "@storiny/shared";
import { User } from "@storiny/types";

import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = "me/settings/avatar";

export type AvatarSettingsResponse = Pick<User, "avatar_id" | "avatar_hex">;
export interface AvatarSettingsPayload {
  avatar_id: string | null;
}

export const { useAvatarSettingsMutation } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    avatarSettings: builder.mutation<
      AvatarSettingsResponse,
      AvatarSettingsPayload
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
