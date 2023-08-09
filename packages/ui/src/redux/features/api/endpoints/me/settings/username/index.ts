import { ContentType } from "@storiny/shared";

import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = "me/settings/username";

export interface UsernameSettingsResponse {}
export interface UsernameSettingsPayload {
  "current-password": string;
  "new-username": string;
}

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
