import { ContentType } from "@storiny/shared";

import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = "me/settings/profile";

export interface ProfileSettingsResponse {}
export interface ProfileSettingsPayload {
  bio: string;
  location: string | null;
  name: string;
}

export const { useProfileSettingsMutation } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    profileSettings: builder.mutation<
      ProfileSettingsResponse,
      ProfileSettingsPayload
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
