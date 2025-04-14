import { Notification } from "@storiny/types";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "me/notifications";
const ITEMS_PER_PAGE = 10;

export type GetNotificationsResponse = Notification[];
export type GetNotificationsType = "unread" | "following" | "friends" | "all";

export const { useGetNotificationsQuery: use_get_notifications_query } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      getNotifications: builder.query<
        { has_more: boolean; items: Notification[] },
        {
          page: number;
          type: GetNotificationsType;
        }
      >({
        query: ({ page, type }) => `/${SEGMENT}?page=${page}&type=${type}`,
        serializeQueryArgs: ({ endpointName, queryArgs }) =>
          `${endpointName}:${queryArgs.type}`,
        transformResponse: (response: Notification[]) => ({
          items: response,
          has_more: response.length === ITEMS_PER_PAGE
        }),
        merge: (current_cache, data) => {
          const new_items = data.items.filter(
            (data_item) =>
              !current_cache.items.some((item) => data_item.id === item.id)
          );

          current_cache.items.push(...new_items);
          current_cache.has_more = new_items.length === ITEMS_PER_PAGE;
        },
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
