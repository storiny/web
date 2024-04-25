import { Subscriber } from "@storiny/types";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (blog_id: string): string => `me/blogs/${blog_id}/subscribers`;
const ITEMS_PER_PAGE = 10;

export type GetBlogSubscribersResponse = Subscriber[];

export const get_blog_subscribers_api = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    getBlogSubscribers: builder.query<
      { has_more: boolean; items: Subscriber[] },
      {
        blog_id: string;
        page: number;
      }
    >({
      query: ({ page, blog_id }) => `/${SEGMENT(blog_id)}?page=${page}`,
      serializeQueryArgs: ({ endpointName, queryArgs }) =>
        `${endpointName}:${queryArgs.blog_id}`,
      transformResponse: (response: Subscriber[]) => ({
        items: response,
        has_more: response.length === ITEMS_PER_PAGE
      }),
      merge: (current_cache, new_items) => {
        current_cache.items = current_cache.items.filter(
          (current_item) =>
            !new_items.items.some((item) => current_item.id === item.id)
        );
        current_cache.items.push(...new_items.items);
        current_cache.has_more = new_items.has_more;
      },
      forceRefetch: ({ currentArg, previousArg }) =>
        currentArg?.blog_id !== previousArg?.blog_id ||
        currentArg?.page !== previousArg?.page
    })
  })
});

export const { useGetBlogSubscribersQuery: use_get_blog_subscribers_query } =
  get_blog_subscribers_api;
