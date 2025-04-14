import { User } from "@storiny/types";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (blog_id: string): string => `blogs/${blog_id}/writers`;
const ITEMS_PER_PAGE = 10;

export type GetBlogWritersResponse = User[];

export const get_blog_writers_api = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    getBlogWriters: builder.query<
      { has_more: boolean; items: User[] },
      {
        blog_id: string;
        page: number;
      }
    >({
      query: ({ page, blog_id }) => `/${SEGMENT(blog_id)}?page=${page}`,
      serializeQueryArgs: ({ endpointName, queryArgs }) =>
        `${endpointName}:${queryArgs.blog_id}`,
      transformResponse: (response: User[]) => ({
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
        currentArg?.page !== previousArg?.page
    })
  })
});

export const { useGetBlogWritersQuery: use_get_blog_writers_query } =
  get_blog_writers_api;
