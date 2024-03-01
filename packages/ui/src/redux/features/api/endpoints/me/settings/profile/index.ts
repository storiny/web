import { ContentType } from "@storiny/shared";
import { AccountGeneralSchema } from "@storiny/web/src/app/(native)/(check-user)/(dashboard)/(splash)/me/account/profile/general-form";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "me/settings/profile";

export type ProfileSettingsPayload = AccountGeneralSchema;

export const { useProfileSettingsMutation: use_profile_settings_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      profileSettings: builder.mutation<void, ProfileSettingsPayload>({
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
