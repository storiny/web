import { ContentType, NotificationType } from "@storiny/shared";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "me/settings/notifications/unsubscribe";

export interface UnsubscribeNotificationPayload {
  id?: string; // Notification ID for invalidating the cache
  type: NotificationType;
}

export const {
  // eslint-disable-next-line prefer-snakecase/prefer-snakecase
  useUnsubscribeNotificationMutation: use_unsubscribe_notification_mutation
} = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    unsubscribeNotification: builder.mutation<
      void,
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
