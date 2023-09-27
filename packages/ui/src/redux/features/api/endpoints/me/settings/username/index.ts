import { ContentType } from "@storiny/shared";
import { UsernameSettingsSchema } from "@storiny/web/src/app/(check-user)/(dashboard)/me/(splash)/(default-lsb)/account/profile/username-settings";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "me/settings/username";

export type UsernameSettingsPayload = UsernameSettingsSchema;

export const { useUsernameSettingsMutation: use_username_settings_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      usernameSettings: builder.mutation<void, UsernameSettingsPayload>({
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
