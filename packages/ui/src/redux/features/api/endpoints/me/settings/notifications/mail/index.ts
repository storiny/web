import { ContentType } from "@storiny/shared";
import { MailNotificationsSchema } from "@storiny/web/src/app/(check-user)/(dashboard)/me/(splash)/(default-lsb)/(default-rsb)/account/notifications/mail-notifications";

import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = "me/settings/notifications/mail";

export interface MailNotificationSettingsResponse {}
export type MailNotificationSettingsPayload = MailNotificationsSchema;

export const { useMailNotificationSettingsMutation } = apiSlice.injectEndpoints(
  {
    endpoints: (builder) => ({
      mailNotificationSettings: builder.mutation<
        MailNotificationSettingsResponse,
        MailNotificationSettingsPayload
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
  }
);
