import { AccountActivity } from "@storiny/types";

import { apiSlice } from "~/redux/features/api/slice";

const ITEMS_PER_PAGE = 10;
const SEGMENT = "me/account-activity";

export type GetAccountActivityResponse = AccountActivity[];

export const { useGetAccountActivityQuery } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAccountActivity: builder.query<
      { hasMore: boolean; items: AccountActivity[] },
      {
        page: number;
      }
    >({
      query: ({ page }) => `/${SEGMENT}?page=${page}`,
      serializeQueryArgs: ({ endpointName }) => endpointName,
      transformResponse: (response: AccountActivity[]) => ({
        items: response,
        hasMore: response.length === ITEMS_PER_PAGE
      }),
      merge: (currentCache, newItems) => {
        currentCache.items.push(...newItems.items);
        currentCache.hasMore = newItems.hasMore;
      },
      forceRefetch: ({ currentArg, previousArg }) =>
        currentArg?.page !== previousArg?.page
    })
  })
});
