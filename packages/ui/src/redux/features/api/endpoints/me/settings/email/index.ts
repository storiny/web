import { ContentType } from "@storiny/shared";
import { EmailSettingsSchema } from "@storiny/web/src/app/(check-user)/(dashboard)/me/(splash)/(default-lsb)/(default-rsb)/account/credentials/email-group";

import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = "me/settings/email";

export interface EmailSettingsResponse {}
export type EmailSettingsPayload = EmailSettingsSchema;

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
