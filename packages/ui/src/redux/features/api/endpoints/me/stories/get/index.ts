import { Story } from "@storiny/types";

import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = "me/stories";
const ITEMS_PER_PAGE = 10;

export type GetStoriesResponse = Story[];

export const getStoriesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getStories: builder.query<
      { hasMore: boolean; items: Story[] },
      {
        page: number;
        query?: string;
        sort:
          | "recent"
          | "old"
          | `popular-${"dsc" | "asc"}`
          | `likes-${"dsc" | "asc"}`;
        type: "published" | "deleted";
      }
    >({
      query: ({ page, sort, query, type }) =>
        `/${SEGMENT}?type=${type}&page=${page}&sort=${sort}${
          query ? `&query=${encodeURIComponent(query)}` : ""
        }`,
      serializeQueryArgs: ({ endpointName, queryArgs }) =>
        `${endpointName}:${queryArgs.type}:${queryArgs.sort}:${queryArgs.query}`,
      transformResponse: (response: Story[]) => ({
        items: response,
        hasMore: response.length === ITEMS_PER_PAGE
      }),
      merge: (currentCache, newItems) => {
        currentCache.items.push(...newItems.items);
        currentCache.hasMore = newItems.hasMore;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({
                type: "Story" as const,
                id
              })),
              "Story"
            ]
          : ["Story"],
      forceRefetch: ({ currentArg, previousArg }) =>
        currentArg?.type !== previousArg?.type ||
        currentArg?.page !== previousArg?.page ||
        currentArg?.sort !== previousArg?.sort ||
        currentArg?.query !== previousArg?.query
    })
  })
});

export const { useGetStoriesQuery } = getStoriesApi;
