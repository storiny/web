import { ContentType } from "@storiny/shared";
import { SiteNotificationsSchema } from "@storiny/web/src/app/(check-user)/(dashboard)/me/(splash)/(default-lsb)/(default-rsb)/account/notifications/site-notifications";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "me/settings/notifications/site";

export type SiteNotificationSettingsPayload = SiteNotificationsSchema;

export const {
  // eslint-disable-next-line prefer-snakecase/prefer-snakecase
  useSiteNotificationSettingsMutation: use_site_notification_settings_mutation
} = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    siteNotificationSettings: builder.mutation<
      void,
      SiteNotificationSettingsPayload
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
