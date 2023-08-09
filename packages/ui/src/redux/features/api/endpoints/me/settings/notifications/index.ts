import { ContentType } from "@storiny/shared";
import { NotificationType } from "@storiny/types";

import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = "me/settings/notifications";

export interface NotificationSettingsResponse {}
export interface NotificationSettingsPayload {
  id?: string; // Notification ID for invalidating the cache
  type: NotificationType;
  value: boolean;
}

export const { useNotificationSettingsMutation } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    notificationSettings: builder.mutation<
      NotificationSettingsResponse,
      NotificationSettingsPayload
    >({
      query: (body) => ({
        url: `/${SEGMENT}`,
        method: "PATCH",
        body: {
          type: body.type,
          value: body.value
        },
        headers: {
          "Content-type": ContentType.JSON
        }
      }),
      invalidatesTags: (result, error, arg) => [
        arg.id ? { type: "Notification", id: arg.id } : "Notification"
      ]
    })
  })
});
