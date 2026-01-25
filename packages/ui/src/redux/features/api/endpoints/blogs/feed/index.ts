import { Story } from "@storiny/types";

import { merge_fn } from "~/redux/features";
import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (blog_id: string): string => `blogs/${blog_id}/feed`;
const ITEMS_PER_PAGE = 10;

export type GetBlogFeedResponse = Story[];

export const {
  useLazyGetBlogFeedQuery: use_get_blog_feed_query,
  endpoints: {
    getBlogFeed: { select: select_blog_feed }
  }
} = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    getBlogFeed: builder.query<
      { has_more: boolean; items: Story[]; page: number },
      {
        blog_id: string;
        page: number;
        query?: string;
        sort: "recent" | "old";
      }
    >({
      query: ({ page, blog_id, query, sort }) =>
        `/${SEGMENT(blog_id)}?page=${page}&sort=${sort}${
          query ? `&query=${encodeURIComponent(query)}` : ""
        }`,
      serializeQueryArgs: ({ endpointName, queryArgs }) =>
        `${endpointName}:${queryArgs.blog_id}:${queryArgs.sort}:${queryArgs.query}`,
      transformResponse: (response: Story[], _, { page }) => ({
        page,
        items: response,
        has_more: response.length === ITEMS_PER_PAGE
      }),
      merge: (cache, data) => merge_fn(cache, data),
      forceRefetch: ({ currentArg, previousArg }) =>
        currentArg?.page !== previousArg?.page ||
        currentArg?.blog_id !== previousArg?.blog_id ||
        currentArg?.sort !== previousArg?.sort ||
        currentArg?.query !== previousArg?.query
    })
  })
});
