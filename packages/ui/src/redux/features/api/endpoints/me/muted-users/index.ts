import { User } from "@storiny/types";

import { api_slice } from "~/redux/features/api/slice";

const ITEMS_PER_PAGE = 10;
const SEGMENT = "me/muted-users";

export type GetMutedUsersResponse = User[];

export const { useGetMutedUsersQuery: use_get_muted_users_query } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      getMutedUsers: builder.query<
        { has_more: boolean; items: User[] },
        {
          page: number;
        }
      >({
        query: ({ page }) => `/${SEGMENT}?page=${page}`,
        serializeQueryArgs: ({ endpointName }) => endpointName,
        transformResponse: (response: User[]) => ({
          items: response,
          has_more: response.length === ITEMS_PER_PAGE
        }),
        merge: (current_cache, new_items) => {
          current_cache.items = current_cache.items.filter(
            (current_item) =>
              !new_items.items.some((item) => current_item.id === item.id)
          );
          current_cache.items.push(...new_items.items);
          current_cache.has_more = new_items.has_more;
        },
        forceRefetch: ({ currentArg, previousArg }) =>
          currentArg?.page !== previousArg?.page
      })
    })
  });
