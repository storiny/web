import { ContentType } from "@storiny/shared";
import { UsernameSettingsSchema } from "@storiny/web/src/app/(check-user)/(dashboard)/me/(splash)/(default-lsb)/account/profile/username-settings";

import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = "me/settings/username";

export interface UsernameSettingsResponse {}
export type UsernameSettingsPayload = UsernameSettingsSchema;

export const { useUsernameSettingsMutation } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    usernameSettings: builder.mutation<
      UsernameSettingsResponse,
      UsernameSettingsPayload
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
