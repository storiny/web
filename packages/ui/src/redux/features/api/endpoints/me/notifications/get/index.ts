import { Notification } from "@storiny/types";

import { merge_fn } from "~/redux/features";
import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "me/notifications";
const ITEMS_PER_PAGE = 10;

export type GetNotificationsResponse = Notification[];
export type GetNotificationsType = "unread" | "following" | "friends" | "all";

export const {
  useLazyGetNotificationsQuery: use_get_notifications_query,
  endpoints: {
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    getNotifications: { select: select_notifications }
  }
} = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    getNotifications: builder.query<
      { has_more: boolean; items: Notification[]; page: number },
      { page: number; type: GetNotificationsType }
    >({
      query: ({ page, type }) => `/${SEGMENT}?page=${page}&type=${type}`,
      serializeQueryArgs: ({ endpointName, queryArgs }) =>
        `${endpointName}:${queryArgs.type}`,
      transformResponse: (response: Notification[], _, { page }) => ({
        page,
        items: response,
        has_more: response.length === ITEMS_PER_PAGE
      }),
      merge: (cache, data) => merge_fn(cache, data),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({
                type: "Notification" as const,
                id
              })),
              "Notification"
            ]
          : ["Notification"],
      forceRefetch: ({ currentArg, previousArg }) =>
        currentArg?.page !== previousArg?.page ||
        currentArg?.type !== previousArg?.type
    })
  })
});
