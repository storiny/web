import { FriendRequest } from "@storiny/types";

import { merge_fn } from "~/redux/features";
import { api_slice } from "~/redux/features/api/slice";

const ITEMS_PER_PAGE = 10;
const SEGMENT = "me/friend-requests";

export type GetFriendRequestsResponse = FriendRequest[];

export const get_friend_requests_api = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    getFriendRequests: builder.query<
      { has_more: boolean; items: FriendRequest[]; page: number },
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
      transformResponse: (response: FriendRequest[], _, { page }) => ({
        page,
        items: response,
        has_more: response.length === ITEMS_PER_PAGE
      }),
      merge: (cache, data) => merge_fn(cache, data),
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
