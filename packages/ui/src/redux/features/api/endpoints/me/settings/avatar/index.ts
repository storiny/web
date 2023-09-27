import { ContentType } from "@storiny/shared";
import { User } from "@storiny/types";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "me/settings/avatar";

export type AvatarSettingsResponse = Pick<User, "avatar_id" | "avatar_hex">;
export interface AvatarSettingsPayload {
  avatar_id: string | null;
}

export const { useAvatarSettingsMutation: use_avatar_settings_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
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
