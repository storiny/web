import { BlogRequest } from "@storiny/types";

import { merge_fn } from "~/redux/features";
import { api_slice } from "~/redux/features/api/slice";

const ITEMS_PER_PAGE = 10;
const SEGMENT = "me/blog-requests";

export type GetBlogRequestsResponse = BlogRequest[];

export const get_blog_requests_api = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    getBlogRequests: builder.query<
      { has_more: boolean; items: BlogRequest[]; page: number },
      { page: number; query?: string }
    >({
      query: ({ page, query }) =>
        `/${SEGMENT}?page=${page}${
          query ? `&query=${encodeURIComponent(query)}` : ""
        }`,
      serializeQueryArgs: ({ endpointName, queryArgs }) =>
        `${endpointName}:${queryArgs.query}`,
      transformResponse: (response: BlogRequest[], _, { page }) => ({
        page,
        items: response,
        has_more: response.length === ITEMS_PER_PAGE
      }),
      merge: (cache, data) => merge_fn(cache, data),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({
                type: "BlogRequest" as const,
                id
              })),
              "BlogRequest"
            ]
          : ["BlogRequest"],
      forceRefetch: ({ currentArg, previousArg }) =>
        currentArg?.page !== previousArg?.page ||
        currentArg?.query !== previousArg?.query
    })
  })
});

export const { useGetBlogRequestsQuery: use_get_blog_requests_query } =
  get_blog_requests_api;
