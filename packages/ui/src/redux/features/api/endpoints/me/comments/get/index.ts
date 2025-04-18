import { Comment } from "@storiny/types";
import { ResponsesSortValue } from "@storiny/web/src/app/(native)/(check-user)/(dashboard)/(splash)/me/(default-rsb)/content/responses/client";

import { merge_fn } from "~/redux/features";
import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "me/comments";
const ITEMS_PER_PAGE = 10;

export type GetCommentsResponse = Comment[];

export const get_comments_api = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    getComments: builder.query<
      { has_more: boolean; items: Comment[]; page: number },
      { page: number; query?: string; sort: ResponsesSortValue }
    >({
      query: ({ page, sort, query }) =>
        `/${SEGMENT}?page=${page}&sort=${sort}${
          query ? `&query=${encodeURIComponent(query)}` : ""
        }`,
      serializeQueryArgs: ({ endpointName, queryArgs }) =>
        `${endpointName}:${queryArgs.sort}:${queryArgs.query}`,
      transformResponse: (response: Comment[], _, { page }) => ({
        page,
        items: response,
        has_more: response.length === ITEMS_PER_PAGE
      }),
      merge: (cache, data) => merge_fn(cache, data),
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

export const {
  useLazyGetCommentsQuery: use_get_comments_query,
  endpoints: {
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    getComments: { select: select_comments }
  }
} = get_comments_api;
