import { User } from "@storiny/types";

import { apiSlice } from "~/redux/features/api/slice";

const ITEMS_PER_PAGE = 10;
const SEGMENT = (userId: string, entityType: GetUserEntityType): string =>
  `user/${userId}/${entityType}`;

export type GetUserFollowersResponse = User[];
export type GetUserEntityType = "followers" | "following" | "friends";

export const { useGetUserEntitiesQuery } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getUserEntities: builder.query<
      { hasMore: boolean; items: User[] },
      {
        entityType: GetUserEntityType;
        page: number;
        query?: string;
        sort: "recent" | "popular" | "old";
        userId: string;
      }
    >({
      query: ({ page, sort = "recent", query, userId, entityType }) =>
        `/${SEGMENT(userId, entityType)}?page=${page}&sort=${sort}${
          query ? `&query=${encodeURIComponent(query)}` : ""
        }`,
      serializeQueryArgs: ({ endpointName, queryArgs }) =>
        `${endpointName}:${queryArgs.entityType}:${queryArgs.userId}:${queryArgs.sort}:${queryArgs.query}`,
      transformResponse: (response: User[]) => ({
        items: response,
        hasMore: response.length === ITEMS_PER_PAGE
      }),
      merge: (currentCache, newItems) => {
        currentCache.items.push(
          ...newItems.items.filter(
            (item) =>
              !currentCache.items.some((cacheItem) => cacheItem.id === item.id)
          )
        );
      },
      forceRefetch: ({ currentArg, previousArg }) =>
        currentArg?.userId !== previousArg?.userId ||
        currentArg?.entityType !== previousArg?.entityType ||
        currentArg?.page !== previousArg?.page ||
        currentArg?.sort !== previousArg?.sort ||
        currentArg?.query !== previousArg?.query
    })
  })
});
