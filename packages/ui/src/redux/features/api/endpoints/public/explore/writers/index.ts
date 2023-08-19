import { StoryCategory } from "@storiny/shared";
import { User } from "@storiny/types";

import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = "public/explore/writers";
const ITEMS_PER_PAGE = 10;

export type GetExploreWritersResponse = User[];

export const { useGetExploreWritersQuery } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getExploreWriters: builder.query<
      { hasMore: boolean; items: User[] },
      { category?: StoryCategory | "all"; page: number; query?: string }
    >({
      query: ({ page, category = "all", query }) =>
        `/${SEGMENT}?page=${page}&category=${category}${
          query ? `&query=${encodeURIComponent(query)}` : ""
        }`,
      serializeQueryArgs: ({ endpointName, queryArgs }) =>
        `${endpointName}:${queryArgs.category}:${queryArgs.query}`,
      transformResponse: (response: User[]) => ({
        items: response,
        hasMore: response.length === ITEMS_PER_PAGE
      }),
      merge: (currentCache, newItems) => {
        currentCache.items.push(...newItems.items);
      },
      forceRefetch: ({ currentArg, previousArg }) =>
        currentArg?.page !== previousArg?.page ||
        currentArg?.category !== previousArg?.category ||
        currentArg?.query !== previousArg?.query
    })
  })
});
