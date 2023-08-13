import { ContentType } from "@storiny/shared";
import { NotificationType } from "@storiny/types";

import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = "me/settings/notifications/unsubscribe";

export interface UnsubscribeNotificationResponse {}
export interface UnsubscribeNotificationPayload {
  id?: string; // Notification ID for invalidating the cache
  type: NotificationType;
}

export const { useUnsubscribeNotificationMutation } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    unsubscribeNotification: builder.mutation<
      UnsubscribeNotificationResponse,
      UnsubscribeNotificationPayload
    >({
      query: (body) => ({
        url: `/${SEGMENT}`,
        method: "PATCH",
        body: {
          type: body.type
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
