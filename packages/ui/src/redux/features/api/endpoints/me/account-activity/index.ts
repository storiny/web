import { AccountActivity } from "@storiny/types";

import { api_slice } from "~/redux/features/api/slice";

const ITEMS_PER_PAGE = 10;
const SEGMENT = "me/account-activity";

export type GetAccountActivityResponse = AccountActivity[];

export const { useGetAccountActivityQuery: use_get_account_activity_query } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      getAccountActivity: builder.query<
        { has_more: boolean; items: AccountActivity[] },
        {
          page: number;
        }
      >({
        query: ({ page }) => `/${SEGMENT}?page=${page}`,
        serializeQueryArgs: ({ endpointName }) => endpointName,
        transformResponse: (response: AccountActivity[]) => ({
          items: response,
          has_more: response.length === ITEMS_PER_PAGE
        }),
        merge: (current_cache, data) => {
          const new_items = data.items.filter(
            (data_item) =>
              !current_cache.items.some((item) => data_item.id === item.id)
          );

          current_cache.items.push(...new_items);
          current_cache.has_more =
            current_cache.has_more && new_items.length === ITEMS_PER_PAGE;
        },
        forceRefetch: ({ currentArg, previousArg }) =>
          currentArg?.page !== previousArg?.page
      })
    })
  });
