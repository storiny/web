import { StoryCategory } from "@storiny/shared";
import { Story } from "@storiny/types";

import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = "public/explore/stories";
const ITEMS_PER_PAGE = 10;

export type GetExploreStoriesResponse = Story[];

export const { useGetExploreStoriesQuery } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getExploreStories: builder.query<
      { hasMore: boolean; items: Story[] },
      { category?: StoryCategory | "all"; page: number; query?: string }
    >({
      query: ({ page, category = "all", query }) =>
        `/${SEGMENT}?page=${page}&category=${category}${
          query ? `&query=${encodeURIComponent(query)}` : ""
        }`,
      serializeQueryArgs: ({ endpointName, queryArgs }) =>
        `${endpointName}:${queryArgs.category}:${queryArgs.query}`,
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
        currentArg?.category !== previousArg?.category ||
        currentArg?.query !== previousArg?.query
    })
  })
});
