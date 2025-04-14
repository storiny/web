import { FriendRequest } from "@storiny/types";

import { api_slice } from "~/redux/features/api/slice";

const ITEMS_PER_PAGE = 10;
const SEGMENT = "me/friend-requests";

export type GetFriendRequestsResponse = FriendRequest[];

export const get_friend_requests_api = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    getFriendRequests: builder.query<
      { has_more: boolean; items: FriendRequest[] },
      {
        page: number;
        query?: string;
        sort: "recent" | "popular" | "old";
      }
    >({
      query: ({ page, sort, query }) =>
        `/${SEGMENT}?page=${page}&sort=${sort}${
          query ? `&query=${encodeURIComponent(query)}` : ""
        }`,
      serializeQueryArgs: ({ endpointName, queryArgs }) =>
        `${endpointName}:${queryArgs.sort}:${queryArgs.query}`,
      transformResponse: (response: FriendRequest[]) => ({
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
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({
                type: "FriendRequest" as const,
                id
              })),
              "FriendRequest"
            ]
          : ["FriendRequest"],
      forceRefetch: ({ currentArg, previousArg }) =>
        currentArg?.page !== previousArg?.page ||
        currentArg?.sort !== previousArg?.sort ||
        currentArg?.query !== previousArg?.query
    })
  })
});

export const { useGetFriendRequestsQuery: use_get_friend_requests_query } =
  get_friend_requests_api;
