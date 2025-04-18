import { Story } from "@storiny/types";

import { merge_fn } from "~/redux/features";
import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (blog_id: string, story_id: string): string =>
  `public/blogs/${blog_id}/stories/${story_id}/recommendations`;
const ITEMS_PER_PAGE = 10;

export type GetBlogStoryRecommendationsResponse = Story[];

export const {
  useLazyGetBlogStoryRecommendationsQuery:
    use_get_blog_story_recommendations_query,
  endpoints: {
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    getBlogStoryRecommendations: { select: select_blog_story_recommendations }
  }
} = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    getBlogStoryRecommendations: builder.query<
      { has_more: boolean; items: Story[]; page: number },
      { blog_id: string; page: number; story_id: string }
    >({
      query: ({ story_id, blog_id, page }) =>
        `/${SEGMENT(blog_id, story_id)}?page=${page}`,
      serializeQueryArgs: ({ endpointName, queryArgs }) =>
        `${endpointName}:${queryArgs.blog_id}:${queryArgs.story_id}`,
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
        currentArg?.story_id !== previousArg?.story_id ||
        currentArg?.blog_id !== previousArg?.blog_id ||
        currentArg?.page !== previousArg?.page
    })
  })
});
