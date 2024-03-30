import { Story } from "@storiny/types";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (blog_id: string, story_id: string): string =>
  `public/blogs/${blog_id}/stories/${story_id}/recommendations`;
const ITEMS_PER_PAGE = 10;

export type GetBlogStoryRecommendationsResponse = Story[];

export const {
  useGetBlogStoryRecommendationsQuery: use_get_blog_story_recommendations_query
} = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    getBlogStoryRecommendations: builder.query<
      { has_more: boolean; items: Story[] },
      {
        blog_id: string;
        page: number;
        story_id: string;
      }
    >({
      query: ({ story_id, blog_id, page }) =>
        `/${SEGMENT(blog_id, story_id)}?page=${page}`,
      serializeQueryArgs: ({ endpointName, queryArgs }) =>
        `${endpointName}:${queryArgs.blog_id}:${queryArgs.story_id}`,
      transformResponse: (response: Story[]) => ({
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
