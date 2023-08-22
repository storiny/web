import { Story } from "@storiny/types";

import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = "feed";
const ITEMS_PER_PAGE = 10;

export type GetHomeFeedResponse = Story[];

export const { useGetHomeFeedQuery } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getHomeFeed: builder.query<
      { hasMore: boolean; items: Story[] },
      { page: number; type: "suggested" | "friends-and-following" }
    >({
      query: ({ page, type = "suggested" }) =>
        `/${SEGMENT}?page=${page}&type=${type}`,
      serializeQueryArgs: ({ endpointName, queryArgs }) =>
        `${endpointName}:${queryArgs.type}`,
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
        currentArg?.type !== previousArg?.type
    })
  })
});
