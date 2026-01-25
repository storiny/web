import { Story } from "@storiny/types";

import { merge_fn } from "~/redux/features";
import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (blog_id: string): string => `blogs/${blog_id}/archive`;
const ITEMS_PER_PAGE = 10;

export type GetBlogArchiveResponse = Story[];

export const {
  useLazyGetBlogArchiveQuery: use_get_blog_archive_query,
  endpoints: {
    getBlogArchive: { select: select_blog_archive }
  }
} = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    getBlogArchive: builder.query<
      { has_more: boolean; items: Story[]; page: number },
      { blog_id: string; month?: number; page: number; year?: number }
    >({
      query: ({ page, blog_id, month, year }) =>
        `/${SEGMENT(blog_id)}?page=${page}${year ? `&year=${year}` : ""}${
          month ? `&month=${month}` : ""
        }`,
      serializeQueryArgs: ({ endpointName, queryArgs }) =>
        `${endpointName}:${queryArgs.blog_id}:${queryArgs.year ?? 0}:${
          queryArgs.month ?? 0
        }`,
      transformResponse: (response: Story[], _, { page }) => ({
        page,
        items: response,
        has_more: response.length === ITEMS_PER_PAGE
      }),
      merge: (cache, data) => merge_fn(cache, data),
      forceRefetch: ({ currentArg, previousArg }) =>
        currentArg?.blog_id !== previousArg?.blog_id ||
        currentArg?.page !== previousArg?.page ||
        currentArg?.year !== previousArg?.year ||
        currentArg?.month !== previousArg?.month
    })
  })
});
