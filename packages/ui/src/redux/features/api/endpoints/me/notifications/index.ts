import { Notification } from "@storiny/types";

import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = "me/notifications";
const ITEMS_PER_PAGE = 10;

export type GetNotificationsResponse = Notification[];
export type GetNotificationsType = "unread" | "following" | "friends" | "all";

export const { useGetNotificationsQuery } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<
      { hasMore: boolean; items: Notification[] },
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
        hasMore: response.length === ITEMS_PER_PAGE
      }),
      merge: (currentCache, newItems) => {
        currentCache.items.push(...newItems.items);
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
