import { ContentType } from "@storiny/shared";
import { MailNotificationsSchema } from "@storiny/web/src/app/(native)/(check-user)/(dashboard)/(splash)/me/(default-rsb)/account/notifications/mail-notifications";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "me/settings/notifications/mail";

export type MailNotificationSettingsPayload = MailNotificationsSchema;

export const {
  useMailNotificationSettingsMutation: use_mail_notification_settings_mutation
} = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    mailNotificationSettings: builder.mutation<
      void,
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
});
