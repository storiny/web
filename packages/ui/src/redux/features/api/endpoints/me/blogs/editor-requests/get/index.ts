import { BlogMemberRequest } from "@storiny/types";

import { merge_fn } from "~/redux/features";
import { api_slice } from "~/redux/features/api/slice";

const ITEMS_PER_PAGE = 10;
const SEGMENT = (blog_id: string): string =>
  `me/blogs/${blog_id}/editor-requests`;

export type GetBlogEditorRequestsResponse = BlogMemberRequest[];

export const get_blog_editor_requests_api = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    getBlogEditorRequests: builder.query<
      { has_more: boolean; items: BlogMemberRequest[]; page: number },
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
      transformResponse: (response: BlogMemberRequest[], _, { page }) => ({
        page,
        items: response,
        has_more: response.length === ITEMS_PER_PAGE
      }),
      merge: (cache, data) => merge_fn(cache, data),
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
  useLazyGetBlogEditorRequestsQuery: use_get_blog_editor_requests_query,
  endpoints: {
    getBlogEditorRequests: { select: select_blog_editor_requests }
  }
} = get_blog_editor_requests_api;
