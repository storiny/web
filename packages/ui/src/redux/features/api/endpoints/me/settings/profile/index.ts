import { ContentType } from "@storiny/shared";
import { AccountGeneralSchema } from "@storiny/web/src/app/(check-user)/(dashboard)/me/(splash)/(default-lsb)/account/profile/general-form";

import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = "me/settings/profile";

export interface ProfileSettingsResponse {}
export type ProfileSettingsPayload = AccountGeneralSchema;

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
