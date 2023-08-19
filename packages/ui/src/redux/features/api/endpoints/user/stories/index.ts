import { Story } from "@storiny/types";

import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = (userId: string): string => `user/${userId}/stories`;
const ITEMS_PER_PAGE = 10;

export type GetUserStoriesResponse = Story[];

export const { useGetUserStoriesQuery } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getUserStories: builder.query<
      { hasMore: boolean; items: Story[] },
      {
        page: number;
        query?: string;
        sort: "recent" | "popular" | "old";
        userId: string;
      }
    >({
      query: ({ page, sort = "recent", query, userId }) =>
        `/${SEGMENT(userId)}?page=${page}&sort=${sort}${
          query ? `&query=${encodeURIComponent(query)}` : ""
        }`,
      serializeQueryArgs: ({ endpointName, queryArgs }) =>
        `${endpointName}:${queryArgs.userId}:${queryArgs.sort}:${queryArgs.query}`,
      transformResponse: (response: Story[]) => ({
        items: response,
        hasMore: response.length === ITEMS_PER_PAGE
      }),
      merge: (currentCache, newItems) => {
        currentCache.items.push(...newItems.items);
      },
      forceRefetch: ({ currentArg, previousArg }) =>
        currentArg?.userId !== previousArg?.userId ||
        currentArg?.page !== previousArg?.page ||
        currentArg?.sort !== previousArg?.sort ||
        currentArg?.query !== previousArg?.query
    })
  })
});
