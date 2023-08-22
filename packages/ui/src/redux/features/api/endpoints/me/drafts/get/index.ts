import { Story } from "@storiny/types";

import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = "me/drafts";
const ITEMS_PER_PAGE = 10;

export type GetDraftsResponse = Story[];

export const getDraftsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDrafts: builder.query<
      { hasMore: boolean; items: Story[] },
      {
        page: number;
        query?: string;
        sort: "recent" | "old";
        type: "pending" | "deleted";
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

export const { useGetDraftsQuery } = getDraftsApi;
