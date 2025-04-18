import { Story } from "@storiny/types";

import { merge_fn } from "~/redux/features";
import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string =>
  `me/blogs/${id}/content/published-stories`;
const ITEMS_PER_PAGE = 10;

export type GetBlogPublishedStoriesReponse = Story[];

export const get_blog_published_stories_api = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    getBlogPublishedStories: builder.query<
      { has_more: boolean; items: Story[]; page: number },
      {
        blog_id: string;
        page: number;
        query?: string;
        sort: "recent" | "old";
      }
    >({
      query: ({ page, sort, query, blog_id }) =>
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
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({
                type: "Story" as const,
                id
              })),
              "Story"
            ]
          : ["Story"],
      forceRefetch: ({ currentArg, previousArg }) =>
        currentArg?.page !== previousArg?.page ||
        currentArg?.sort !== previousArg?.sort ||
        currentArg?.query !== previousArg?.query
    })
  })
});

export const {
  useLazyGetBlogPublishedStoriesQuery: use_get_blog_published_stories_query,
  endpoints: {
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    getBlogPublishedStories: { select: select_blog_published_stories }
  }
} = get_blog_published_stories_api;
