import { AccountActivity } from "@storiny/types";

import { merge_fn } from "~/redux/features";
import { api_slice } from "~/redux/features/api/slice";

const ITEMS_PER_PAGE = 10;
const SEGMENT = "me/account-activity";

export type GetAccountActivityResponse = AccountActivity[];

export const {
  useLazyGetAccountActivityQuery: use_get_account_activity_query,
  endpoints: {
    getAccountActivity: { select: select_account_activity }
  }
} = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    getAccountActivity: builder.query<
      { has_more: boolean; items: AccountActivity[]; page: number },
      { page: number }
    >({
      query: ({ page }) => `/${SEGMENT}?page=${page}`,
      serializeQueryArgs: ({ endpointName }) => endpointName,
      transformResponse: (response: AccountActivity[], _, { page }) => ({
        page,
        items: response,
        has_more: response.length === ITEMS_PER_PAGE
      }),
      merge: (cache, data) => merge_fn(cache, data),
      forceRefetch: ({ currentArg, previousArg }) =>
        currentArg?.page !== previousArg?.page
    })
  })
});
