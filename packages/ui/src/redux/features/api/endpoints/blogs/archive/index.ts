import { Story } from "@storiny/types";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (blog_id: string): string => `blogs/${blog_id}/archive`;
const ITEMS_PER_PAGE = 10;

export type GetBlogArchiveResponse = Story[];

export const { useGetBlogArchiveQuery: use_get_blog_archive_query } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      getBlogArchive: builder.query<
        { has_more: boolean; items: Story[] },
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
        transformResponse: (response: Story[]) => ({
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
        forceRefetch: ({ currentArg, previousArg }) =>
          currentArg?.blog_id !== previousArg?.blog_id ||
          currentArg?.page !== previousArg?.page ||
          currentArg?.year !== previousArg?.year ||
          currentArg?.month !== previousArg?.month
      })
    })
  });
