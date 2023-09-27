import { Comment } from "@storiny/types";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "me/comments";
const ITEMS_PER_PAGE = 10;

export type GetCommentsResponse = Comment[];

export const get_comments_api = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    getComments: builder.query<
      { has_more: boolean; items: Comment[] },
      {
        page: number;
        query?: string;
        sort:
          | "recent"
          | "old"
          | `replies-${"dsc" | "asc"}`
          | `likes-${"dsc" | "asc"}`;
      }
    >({
      query: ({ page, sort, query }) =>
        `/${SEGMENT}?page=${page}&sort=${sort}${
          query ? `&query=${encodeURIComponent(query)}` : ""
        }`,
      serializeQueryArgs: ({ endpointName, queryArgs }) =>
        `${endpointName}:${queryArgs.sort}:${queryArgs.query}`,
      transformResponse: (response: Comment[]) => ({
        items: response,
        has_more: response.length === ITEMS_PER_PAGE
      }),
      merge: (current_cache, new_items) => {
        current_cache.items.push(...new_items.items);
        current_cache.has_more = new_items.has_more;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({
                type: "Comment" as const,
                id
              })),
              "Comment"
            ]
          : ["Comment"],
      forceRefetch: ({ currentArg, previousArg }) =>
        currentArg?.page !== previousArg?.page ||
        currentArg?.sort !== previousArg?.sort ||
        currentArg?.query !== previousArg?.query
    })
  })
});

export const { useGetCommentsQuery: use_get_comments_query } = get_comments_api;
