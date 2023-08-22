import { StoryCategory } from "@storiny/shared";
import { Tag } from "@storiny/types";

import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = "public/explore/tags";
const ITEMS_PER_PAGE = 10;

export type GetExploreTagsResponse = Tag[];

export const { useGetExploreTagsQuery } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getExploreTags: builder.query<
      { hasMore: boolean; items: Tag[] },
      { category?: StoryCategory | "all"; page: number; query?: string }
    >({
      query: ({ page, category = "all", query }) =>
        `/${SEGMENT}?page=${page}&category=${category}${
          query ? `&query=${encodeURIComponent(query)}` : ""
        }`,
      serializeQueryArgs: ({ endpointName, queryArgs }) =>
        `${endpointName}:${queryArgs.category}:${queryArgs.query}`,
      transformResponse: (response: Tag[]) => ({
        items: response,
        hasMore: response.length === ITEMS_PER_PAGE
      }),
      merge: (currentCache, newItems) => {
        currentCache.items.push(...newItems.items);
        currentCache.hasMore = newItems.hasMore;
      },
      forceRefetch: ({ currentArg, previousArg }) =>
        currentArg?.page !== previousArg?.page ||
        currentArg?.category !== previousArg?.category ||
        currentArg?.query !== previousArg?.query
    })
  })
});
