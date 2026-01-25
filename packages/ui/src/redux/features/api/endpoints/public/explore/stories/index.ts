import { StoryCategory } from "@storiny/shared";
import { Story } from "@storiny/types";

import { merge_fn } from "~/redux/features";
import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "public/explore/stories";
const ITEMS_PER_PAGE = 10;

export type GetExploreStoriesResponse = Story[];

export const {
  useLazyGetExploreStoriesQuery: use_get_explore_stories_query,
  endpoints: {
    getExploreStories: { select: select_explore_stories }
  }
} = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    getExploreStories: builder.query<
      { has_more: boolean; items: Story[]; page: number },
      { category?: StoryCategory | "all"; page: number; query?: string }
    >({
      query: ({ page, category = "all", query }) =>
        `/${SEGMENT}?page=${page}&category=${category}${
          query ? `&query=${encodeURIComponent(query)}` : ""
        }`,
      serializeQueryArgs: ({ endpointName, queryArgs }) =>
        `${endpointName}:${queryArgs.category}:${queryArgs.query}`,
      transformResponse: (response: Story[], _, { page }) => ({
        page,
        items: response,
        has_more: response.length === ITEMS_PER_PAGE
      }),
      merge: (cache, data) => merge_fn(cache, data),
      forceRefetch: ({ currentArg, previousArg }) =>
        currentArg?.page !== previousArg?.page ||
        currentArg?.category !== previousArg?.category ||
        currentArg?.query !== previousArg?.query
    })
  })
});
