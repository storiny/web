import { User } from "@storiny/types";

import { api_slice } from "~/redux/features/api/slice";

const ITEMS_PER_PAGE = 10;
const SEGMENT = (user_id: string, entity_type: GetUserEntityType): string =>
  `users/${user_id}/${entity_type}`;

export type GetUserFollowersResponse = User[];
export type GetUserEntityType = "followers" | "following" | "friends";

export const { useGetUserEntitiesQuery: use_get_user_entities_query } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      getUserEntities: builder.query<
        { has_more: boolean; items: User[] },
        {
          entity_type: GetUserEntityType;
          page: number;
          query?: string;
          sort: "recent" | "popular" | "old";
          user_id: string;
        }
      >({
        query: ({ page, sort = "recent", query, user_id, entity_type }) =>
          `/${SEGMENT(user_id, entity_type)}?page=${page}&sort=${sort}${
            query ? `&query=${encodeURIComponent(query)}` : ""
          }`,
        serializeQueryArgs: ({ endpointName, queryArgs }) =>
          `${endpointName}:${queryArgs.entity_type}:${queryArgs.user_id}:${queryArgs.sort}:${queryArgs.query}`,
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
          currentArg?.user_id !== previousArg?.user_id ||
          currentArg?.entity_type !== previousArg?.entity_type ||
          currentArg?.page !== previousArg?.page ||
          currentArg?.sort !== previousArg?.sort ||
          currentArg?.query !== previousArg?.query
      })
    })
  });
