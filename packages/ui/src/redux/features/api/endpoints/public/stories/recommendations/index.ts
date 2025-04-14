import { Story } from "@storiny/types";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (story_id: string): string =>
  `public/stories/${story_id}/recommendations`;
const ITEMS_PER_PAGE = 10;

export type GetStoryRecommendationsResponse = Story[];

export const {
  useGetStoryRecommendationsQuery: use_get_story_recommendations_query
} = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    getStoryRecommendations: builder.query<
      { has_more: boolean; items: Story[] },
      {
        page: number;
        story_id: string;
      }
    >({
      query: ({ story_id, page }) => `/${SEGMENT(story_id)}?page=${page}`,
      serializeQueryArgs: ({ endpointName, queryArgs }) =>
        `${endpointName}:${queryArgs.story_id}`,
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
        currentArg?.page !== previousArg?.page
    })
  })
});
