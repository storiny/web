import { BlogMemberRequest } from "@storiny/types";

import { api_slice } from "~/redux/features/api/slice";

const ITEMS_PER_PAGE = 10;
const SEGMENT = (blog_id: string): string =>
  `me/blogs/${blog_id}/editor-requests`;

export type GetBlogEditorRequestsResponse = BlogMemberRequest[];

export const get_blog_editor_requests_api = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    getBlogEditorRequests: builder.query<
      { has_more: boolean; items: BlogMemberRequest[] },
      {
        blog_id: string;
        page: number;
        query?: string;
      }
    >({
      query: ({ page, query, blog_id }) =>
        `/${SEGMENT(blog_id)}?page=${page}${
          query ? `&query=${encodeURIComponent(query)}` : ""
        }`,
      serializeQueryArgs: ({ endpointName, queryArgs }) =>
        `${endpointName}:${queryArgs.blog_id}:${queryArgs.query}`,
      transformResponse: (response: BlogMemberRequest[]) => ({
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
                type: "BlogEditorRequest" as const,
                id
              })),
              "BlogEditorRequest"
            ]
          : ["BlogEditorRequest"],
      forceRefetch: ({ currentArg, previousArg }) =>
        currentArg?.page !== previousArg?.page ||
        currentArg?.blog_id !== previousArg?.blog_id ||
        currentArg?.query !== previousArg?.query
    })
  })
});

export const {
  useGetBlogEditorRequestsQuery: use_get_blog_editor_requests_query
} = get_blog_editor_requests_api;
