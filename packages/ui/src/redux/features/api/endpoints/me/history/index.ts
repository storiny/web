import { Story } from "@storiny/types";

import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = "me/history";
const ITEMS_PER_PAGE = 10;

export type GetHistoryResponse = Story[];

export const { useGetHistoryQuery } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getHistory: builder.query<
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
        currentCache.items.push(...newItems.items);
        currentCache.hasMore = newItems.hasMore;
      },
      forceRefetch: ({ currentArg, previousArg }) =>
        currentArg?.page !== previousArg?.page ||
        currentArg?.query !== previousArg?.query
    })
  })
});
