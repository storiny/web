import { User } from "@storiny/types";

import { apiSlice } from "~/redux/features/api/slice";

const ITEMS_PER_PAGE = 10;
const SEGMENT = (relationType: GetUserRelationsType): string =>
  `me/${relationType}`;

export type GetUserRelationsResponse = User[];
export type GetUserRelationsType = "followers" | "following" | "friends";

export const { useGetRelationsQuery } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getRelations: builder.query<
      { hasMore: boolean; items: User[] },
      {
        page: number;
        query?: string;
        relationType: GetUserRelationsType;
        sort: "recent" | "popular" | "old";
      }
    >({
      query: ({ page, sort, query, relationType }) =>
        `/${SEGMENT(relationType)}?page=${page}&sort=${sort}${
          query ? `&query=${encodeURIComponent(query)}` : ""
        }`,
      serializeQueryArgs: ({ endpointName, queryArgs }) =>
        `${endpointName}:${queryArgs.relationType}:${queryArgs.sort}:${queryArgs.query}`,
      transformResponse: (response: User[]) => ({
        items: response,
        hasMore: response.length === ITEMS_PER_PAGE
      }),
      merge: (currentCache, newItems) => {
        currentCache.items.push(...newItems.items);
        currentCache.hasMore = newItems.hasMore;
      },
      forceRefetch: ({ currentArg, previousArg }) =>
        currentArg?.relationType !== previousArg?.relationType ||
        currentArg?.page !== previousArg?.page ||
        currentArg?.sort !== previousArg?.sort ||
        currentArg?.query !== previousArg?.query
    })
  })
});
