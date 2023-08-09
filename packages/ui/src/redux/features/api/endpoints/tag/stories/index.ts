import { Story } from "@storiny/types";

import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = (tagName: string): string => `tag/${tagName}/stories`;
const ITEMS_PER_PAGE = 10;

export type GetTagStoriesResponse = Story[];

export const { useGetTagStoriesQuery } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTagStories: builder.query<
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
    })
  })
});
