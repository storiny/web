import { Notification } from "@storiny/types";

import { ApiQueryBuilder } from "~/redux/features/api/types";

const SEGMENT = "me/notifications";
const ITEMS_PER_PAGE = 10;

export type GetNotificationsResponse = Notification[];

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const getNotifications = (builder: ApiQueryBuilder) =>
  builder.query<
    { hasMore: boolean; items: Notification[] },
    {
      page: number;
      type: "unread" | "following" | "friends" | "all";
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
      currentCache.items.push(
        ...newItems.items.filter(
          (item) =>
            !currentCache.items.some((cacheItem) => cacheItem.id === item.id)
        )
      );
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
  });
