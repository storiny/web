import { User } from "@storiny/types";

import { api_slice } from "~/redux/features/api/slice";

const ITEMS_PER_PAGE = 10;
const SEGMENT = (relation_type: GetUserRelationsType): string =>
  `me/${relation_type}`;

export type GetUserRelationsResponse = User[];
export type GetUserRelationsType = "followers" | "following" | "friends";

export const { useGetRelationsQuery: use_get_relations_query } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      getRelations: builder.query<
        { has_more: boolean; items: User[] },
        {
          page: number;
          query?: string;
          relation_type: GetUserRelationsType;
          sort: "recent" | "popular" | "old";
        }
      >({
        query: ({ page, sort, query, relation_type }) =>
          `/${SEGMENT(relation_type)}?page=${page}&sort=${sort}${
            query ? `&query=${encodeURIComponent(query)}` : ""
          }`,
        serializeQueryArgs: ({ endpointName, queryArgs }) =>
          `${endpointName}:${queryArgs.relation_type}:${queryArgs.sort}:${queryArgs.query}`,
        transformResponse: (response: User[]) => ({
          items: response,
          has_more: response.length === ITEMS_PER_PAGE
        }),
        merge: (current_cache, data) => {
          const new_items = data.items.filter(
            (data_item) =>
              !current_cache.items.some((item) => data_item.id === item.id)
          );

          current_cache.items.push(...new_items);
          current_cache.has_more = new_items.length === ITEMS_PER_PAGE;
        },
        forceRefetch: ({ currentArg, previousArg }) =>
          currentArg?.relation_type !== previousArg?.relation_type ||
          currentArg?.page !== previousArg?.page ||
          currentArg?.sort !== previousArg?.sort ||
          currentArg?.query !== previousArg?.query
      })
    })
  });
