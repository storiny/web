import { Blog } from "@storiny/types";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "me/blogs";
const ITEMS_PER_PAGE = 10;

export type GetBlogsResponse = Blog[];

export const get_blogs_api = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    getBlogs: builder.query<
      { has_more: boolean; items: Blog[] },
      { page: number }
    >({
      query: ({ page }) => `/${SEGMENT}?page=${page}`,
      serializeQueryArgs: ({ endpointName }) => endpointName,
      transformResponse: (response: Blog[]) => ({
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
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({
                type: "Blog" as const,
                id
              })),
              "Blog"
            ]
          : ["Blog"],
      forceRefetch: ({ currentArg, previousArg }) =>
        currentArg?.page !== previousArg?.page
    })
  })
});

export const { useGetBlogsQuery: use_get_blogs_query } = get_blogs_api;
