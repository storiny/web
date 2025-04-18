import { Story } from "@storiny/types";

import { merge_fn } from "~/redux/features";
import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (story_id: string): string =>
  `public/stories/${story_id}/recommendations`;
const ITEMS_PER_PAGE = 10;

export type GetStoryRecommendationsResponse = Story[];

export const {
  useLazyGetStoryRecommendationsQuery: use_get_story_recommendations_query,
  endpoints: {
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    getStoryRecommendations: { select: select_story_recommendations }
  }
} = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    getStoryRecommendations: builder.query<
      { has_more: boolean; items: Story[]; page: number },
      { page: number; story_id: string }
    >({
      query: ({ story_id, page }) => `/${SEGMENT(story_id)}?page=${page}`,
      serializeQueryArgs: ({ endpointName, queryArgs }) =>
        `${endpointName}:${queryArgs.story_id}`,
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
        currentArg?.page !== previousArg?.page
    })
  })
});
