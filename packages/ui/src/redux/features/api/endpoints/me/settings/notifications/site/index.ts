import { ContentType } from "@storiny/shared";
import { SiteNotificationsSchema } from "@storiny/web/src/app/(check-user)/(dashboard)/me/(splash)/(default-lsb)/(default-rsb)/account/notifications/site-notifications";

import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = "me/settings/notifications/site";

export interface SiteNotificationSettingsResponse {}
export type SiteNotificationSettingsPayload = SiteNotificationsSchema;

export const { useSiteNotificationSettingsMutation } = apiSlice.injectEndpoints(
  {
    endpoints: (builder) => ({
      siteNotificationSettings: builder.mutation<
        SiteNotificationSettingsResponse,
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
  }
);
