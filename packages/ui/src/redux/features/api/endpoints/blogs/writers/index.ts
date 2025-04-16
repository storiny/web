import { User } from "@storiny/types";

import { merge_fn } from "~/redux/features";
import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (blog_id: string): string => `blogs/${blog_id}/writers`;
const ITEMS_PER_PAGE = 10;

export type GetBlogWritersResponse = User[];

export const get_blog_writers_api = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    getBlogWriters: builder.query<
      { has_more: boolean; items: User[]; page: number },
      {
        blog_id: string;
        page: number;
      }
    >({
      query: ({ page, blog_id }) => `/${SEGMENT(blog_id)}?page=${page}`,
      serializeQueryArgs: ({ endpointName, queryArgs }) =>
        `${endpointName}:${queryArgs.blog_id}`,
      transformResponse: (response: User[], _, { page }) => ({
        page,
        items: response,
        has_more: response.length === ITEMS_PER_PAGE
      }),
      merge: (cache, data) => merge_fn(cache, data),
      forceRefetch: ({ currentArg, previousArg }) =>
        currentArg?.blog_id !== previousArg?.blog_id ||
        currentArg?.page !== previousArg?.page
    })
  })
});

export const {
  useLazyGetBlogWritersQuery: use_get_blog_writers_query,
  endpoints: {
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    getBlogWriters: { select: select_blog_writers }
  }
} = get_blog_writers_api;
