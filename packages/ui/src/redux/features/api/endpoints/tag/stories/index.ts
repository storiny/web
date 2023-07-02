import { Story } from "@storiny/types";

import { ApiQueryBuilder } from "~/redux/features/api/types";

const SEGMENT = (tagName: string): string => `tag/${tagName}/stories`;
const ITEMS_PER_PAGE = 10;

export type GetTagStoriesResponse = Story[];

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const getTagStories = (builder: ApiQueryBuilder) =>
  builder.query<
    { hasMore: boolean; items: Story[] },
    { page: number; query?: string; sort: string; tagName: string }
  >({
    query: ({ page, sort = "popular", tagName, query }) =>
      `/${SEGMENT(tagName)}?page=${page}&sort=${sort}${
        query ? `&query=${encodeURIComponent(query)}` : ""
      }`,
    serializeQueryArgs: ({ endpointName, queryArgs }) =>
      `${endpointName}:${queryArgs.tagName}:${queryArgs.sort}:${queryArgs.query}`,
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
      currentArg?.tagName !== previousArg?.tagName ||
      currentArg?.page !== previousArg?.page ||
      currentArg?.sort !== previousArg?.sort ||
      currentArg?.query !== previousArg?.query
  });
