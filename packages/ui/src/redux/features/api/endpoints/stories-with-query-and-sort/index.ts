import { Story } from "@storiny/types";

import { ApiQueryBuilder } from "~/redux/features/api/types";

export type GetLikedStoriesResponse = Story[];

const ITEMS_PER_PAGE = 10;

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const getStoriesWithQueryAndSort = (
  builder: ApiQueryBuilder,
  segment: string,
  defaultSort: string = "recent"
) =>
  builder.query<
    { hasMore: boolean; items: Story[] },
    { page: number; query?: string; sort: string }
  >({
    query: ({ page, sort = defaultSort, query }) =>
      `/${segment}?page=${page}&sort=${sort}${
        query ? `&query=${encodeURIComponent(query)}` : ""
      }`,
    serializeQueryArgs: ({ endpointName, queryArgs }) =>
      `${endpointName}:${queryArgs.sort}:${queryArgs.query}`,
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
      currentArg?.sort !== previousArg?.sort ||
      currentArg?.query !== previousArg?.query,
  });
