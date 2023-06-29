import { Story } from "@storiny/types";

import { ApiQueryBuilder } from "~/redux/features/api/types";

const SEGMENT = "feed";
const ITEMS_PER_PAGE = 10;

export type GetHomeFeedResponse = Story[];

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const getHomeFeed = (builder: ApiQueryBuilder) =>
  builder.query<
    { hasMore: boolean; items: Story[] },
    { page: number; type: "suggested" | "friends-and-following" }
  >({
    query: ({ page, type = "suggested" }) =>
      `/${SEGMENT}?page=${page}&type=${type}`,
    serializeQueryArgs: ({ endpointName, queryArgs }) =>
      `${endpointName}:${queryArgs.type}`,
    transformResponse: (response: Story[]) => ({
      items: response,
      hasMore: response.length === ITEMS_PER_PAGE,
    }),
    merge: (currentCache, newItems) => {
      currentCache.items.push(
        ...newItems.items.filter(
          (item) =>
            !currentCache.items.some((cacheItem) => cacheItem.id === item.id)
        )
      );
    },
    forceRefetch: ({ currentArg, previousArg }) =>
      currentArg?.page !== previousArg?.page ||
      currentArg?.type !== previousArg?.type,
  });
