import { Story } from "@storiny/types";

import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = (storyId: string): string =>
  `public/stories/${storyId}/recommendations`;
const ITEMS_PER_PAGE = 10;

export type GetStoryRecommendationsResponse = Story[];

export const { useGetStoryRecommendationsQuery } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getStoryRecommendations: builder.query<
      { hasMore: boolean; items: Story[] },
      {
        page: number;
        storyId: string;
      }
    >({
      query: ({ storyId, page }) => `/${SEGMENT(storyId)}?page=${page}`,
      serializeQueryArgs: ({ endpointName, queryArgs }) =>
        `${endpointName}:${queryArgs.storyId}`,
      transformResponse: (response: Story[]) => ({
        items: response,
        hasMore: response.length === ITEMS_PER_PAGE
      }),
      merge: (currentCache, newItems) => {
        currentCache.items.push(...newItems.items);
        currentCache.hasMore = newItems.hasMore;
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
        currentArg?.storyId !== previousArg?.storyId ||
        currentArg?.page !== previousArg?.page
    })
  })
});
