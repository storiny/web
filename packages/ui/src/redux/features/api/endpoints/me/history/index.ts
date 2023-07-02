import { Story } from "@storiny/types";

import { ApiQueryBuilder } from "~/redux/features/api/types";

const SEGMENT = "me/history";
const ITEMS_PER_PAGE = 10;

export type GetHistoryResponse = Story[];

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const getHistory = (builder: ApiQueryBuilder) =>
  builder.query<
    { hasMore: boolean; items: Story[] },
    { page: number; query?: string }
  >({
    query: ({ page, query }) =>
      `/${SEGMENT}?page=${page}${
        query ? `&query=${encodeURIComponent(query)}` : ""
      }`,
    serializeQueryArgs: ({ endpointName, queryArgs }) =>
      `${endpointName}:${queryArgs.query}`,
    transformResponse: (response: Story[]) => ({
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
    forceRefetch: ({ currentArg, previousArg }) =>
      currentArg?.page !== previousArg?.page ||
      currentArg?.query !== previousArg?.query
  });
