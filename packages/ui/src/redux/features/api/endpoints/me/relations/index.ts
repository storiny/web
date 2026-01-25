import { User } from "@storiny/types";

import { merge_fn } from "~/redux/features";
import { api_slice } from "~/redux/features/api/slice";

const ITEMS_PER_PAGE = 10;
const SEGMENT = (relation_type: GetUserRelationsType): string =>
  `me/${relation_type}`;

export type GetUserRelationsResponse = User[];
export type GetUserRelationsType = "followers" | "following" | "friends";

export const {
  useLazyGetRelationsQuery: use_get_relations_query,
  endpoints: {
    getRelations: { select: select_relations }
  }
} = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    getRelations: builder.query<
      { has_more: boolean; items: User[]; page: number },
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
      transformResponse: (response: User[], _, { page }) => ({
        page,
        items: response,
        has_more: response.length === ITEMS_PER_PAGE
      }),
      merge: (cache, data) => merge_fn(cache, data),
      forceRefetch: ({ currentArg, previousArg }) =>
        currentArg?.relation_type !== previousArg?.relation_type ||
        currentArg?.page !== previousArg?.page ||
        currentArg?.sort !== previousArg?.sort ||
        currentArg?.query !== previousArg?.query
    })
  })
});
