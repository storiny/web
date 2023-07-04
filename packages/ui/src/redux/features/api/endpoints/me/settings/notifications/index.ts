import { ContentType } from "@storiny/shared";
import { NotificationType } from "@storiny/types";

import { ApiQueryBuilder } from "~/redux/features/api/types";

const SEGMENT = "me/settings/notifications";

export type NotificationSettingsResponse = void;
export interface NotificationSettingsPayload {
  id?: string;
  type: NotificationType;
  value: boolean; // Notification ID for invalidating cache
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const notificationSettings = (builder: ApiQueryBuilder) =>
  builder.mutation<NotificationSettingsResponse, NotificationSettingsPayload>({
    query: (body) => ({
      url: `/${SEGMENT}`,
      method: "POST",
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
  });
