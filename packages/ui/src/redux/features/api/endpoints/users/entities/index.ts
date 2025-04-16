import { User } from "@storiny/types";

import { merge_fn } from "~/redux/features";
import { api_slice } from "~/redux/features/api/slice";

const ITEMS_PER_PAGE = 10;
const SEGMENT = (user_id: string, entity_type: GetUserEntityType): string =>
  `users/${user_id}/${entity_type}`;

export type GetUserFollowersResponse = User[];
export type GetUserEntityType = "followers" | "following" | "friends";

export const {
  useLazyGetUserEntitiesQuery: use_get_user_entities_query,
  endpoints: {
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    getUserEntities: { select: select_user_entities }
  }
} = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    getUserEntities: builder.query<
      { has_more: boolean; items: User[]; page: number },
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
      transformResponse: (response: User[], _, { page }) => ({
        page,
        items: response,
        has_more: response.length === ITEMS_PER_PAGE
      }),
      merge: (cache, data) => merge_fn(cache, data),
      forceRefetch: ({ currentArg, previousArg }) =>
        currentArg?.user_id !== previousArg?.user_id ||
        currentArg?.entity_type !== previousArg?.entity_type ||
        currentArg?.page !== previousArg?.page ||
        currentArg?.sort !== previousArg?.sort ||
        currentArg?.query !== previousArg?.query
    })
  })
});
