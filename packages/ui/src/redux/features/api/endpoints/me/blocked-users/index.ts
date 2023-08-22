import { User } from "@storiny/types";

import { apiSlice } from "~/redux/features/api/slice";

const ITEMS_PER_PAGE = 10;
const SEGMENT = "me/blocked-users";

export type GetBlockedUsersResponse = User[];

export const { useGetBlockedUsersQuery } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getBlockedUsers: builder.query<
      { hasMore: boolean; items: User[] },
      {
        page: number;
        query?: string;
        sort: "recent" | "old";
      }
    >({
      query: ({ page, sort, query }) =>
        `/${SEGMENT}?page=${page}&sort=${sort}${
          query ? `&query=${encodeURIComponent(query)}` : ""
        }`,
      serializeQueryArgs: ({ endpointName, queryArgs }) =>
        `${endpointName}:${queryArgs.sort}:${queryArgs.query}`,
      transformResponse: (response: User[]) => ({
        items: response,
        hasMore: response.length === ITEMS_PER_PAGE
      }),
      merge: (currentCache, newItems) => {
        currentCache.items.push(...newItems.items);
        currentCache.hasMore = newItems.hasMore;
      },
      forceRefetch: ({ currentArg, previousArg }) =>
        currentArg?.page !== previousArg?.page ||
        currentArg?.sort !== previousArg?.sort ||
        currentArg?.query !== previousArg?.query
    })
  })
});
