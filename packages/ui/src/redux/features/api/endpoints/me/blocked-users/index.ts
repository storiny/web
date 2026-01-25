import { User } from "@storiny/types";

import { merge_fn } from "~/redux/features";
import { api_slice } from "~/redux/features/api/slice";

const ITEMS_PER_PAGE = 10;
const SEGMENT = "me/blocked-users";

export type GetBlockedUsersResponse = User[];

export const {
  useLazyGetBlockedUsersQuery: use_get_blocked_users_query,
  endpoints: {
    getBlockedUsers: { select: select_blocked_users }
  }
} = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    getBlockedUsers: builder.query<
      { has_more: boolean; items: User[]; page: number },
      { page: number }
    >({
      query: ({ page }) => `/${SEGMENT}?page=${page}`,
      serializeQueryArgs: ({ endpointName }) => endpointName,
      transformResponse: (response: User[], _, { page }) => ({
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
