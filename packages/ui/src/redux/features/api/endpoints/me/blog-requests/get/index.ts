import { BlogRequest } from "@storiny/types";

import { api_slice } from "~/redux/features/api/slice";

const ITEMS_PER_PAGE = 10;
const SEGMENT = "me/blog-requests";

export type GetBlogRequestsResponse = BlogRequest[];

export const get_blog_requests_api = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    getBlogRequests: builder.query<
      { has_more: boolean; items: BlogRequest[] },
      {
        page: number;
        query?: string;
      }
    >({
      query: ({ page, query }) =>
        `/${SEGMENT}?page=${page}${
          query ? `&query=${encodeURIComponent(query)}` : ""
        }`,
      serializeQueryArgs: ({ endpointName, queryArgs }) =>
        `${endpointName}:${queryArgs.query}`,
      transformResponse: (response: BlogRequest[]) => ({
        items: response,
        has_more: response.length === ITEMS_PER_PAGE
      }),
      merge: (current_cache, data) => {
        const new_items = data.items.filter(
          (data_item) =>
            !current_cache.items.some((item) => data_item.id === item.id)
        );

        current_cache.items.push(...new_items);
        current_cache.has_more =
          current_cache.has_more && new_items.length === ITEMS_PER_PAGE;
      },
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
