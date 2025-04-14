import { Story } from "@storiny/types";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (blog_id: string): string => `blogs/${blog_id}/feed`;
const ITEMS_PER_PAGE = 10;

export type GetBlogFeedResponse = Story[];

export const { useGetBlogFeedQuery: use_get_blog_feed_query } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      getBlogFeed: builder.query<
        { has_more: boolean; items: Story[] },
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
          currentArg?.page !== previousArg?.page ||
          currentArg?.blog_id !== previousArg?.blog_id ||
          currentArg?.sort !== previousArg?.sort ||
          currentArg?.query !== previousArg?.query
      })
    })
  });
