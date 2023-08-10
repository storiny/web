import { ContentType } from "@storiny/shared";

import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = "me/settings/email";

export interface EmailSettingsResponse {}
export interface EmailSettingsPayload {
  "current-password": string;
  "new-email": string;
}

export const { useEmailSettingsMutation } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    emailSettings: builder.mutation<
      EmailSettingsResponse,
      EmailSettingsPayload
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
