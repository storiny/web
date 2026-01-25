import { Blog } from "@storiny/types";

import { merge_fn } from "~/redux/features";
import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "me/blogs";
const ITEMS_PER_PAGE = 10;

export type GetBlogsResponse = Blog[];

export const get_blogs_api = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    getBlogs: builder.query<
      { has_more: boolean; items: Blog[]; page: number },
      { page: number }
    >({
      query: ({ page }) => `/${SEGMENT}?page=${page}`,
      serializeQueryArgs: ({ endpointName }) => endpointName,
      transformResponse: (response: Blog[], _, { page }) => ({
        page,
        items: response,
        has_more: response.length === ITEMS_PER_PAGE
      }),
      merge: (cache, data) => merge_fn(cache, data),
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

export const {
  useLazyGetBlogsQuery: use_get_blogs_query,
  endpoints: {
    getBlogs: { select: select_blogs }
  }
} = get_blogs_api;
