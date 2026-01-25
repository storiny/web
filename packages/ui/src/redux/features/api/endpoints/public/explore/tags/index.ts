import { StoryCategory } from "@storiny/shared";
import { Tag } from "@storiny/types";

import { merge_fn } from "~/redux/features";
import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "public/explore/tags";
const ITEMS_PER_PAGE = 10;

export type GetExploreTagsResponse = Tag[];

export const {
  useLazyGetExploreTagsQuery: use_get_explore_tags_query,
  endpoints: {
    getExploreTags: { select: select_explore_tags }
  }
} = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    getExploreTags: builder.query<
      { has_more: boolean; items: Tag[]; page: number },
      { category?: StoryCategory | "all"; page: number; query?: string }
    >({
      query: ({ page, category = "all", query }) =>
        `/${SEGMENT}?page=${page}&category=${category}${
          query ? `&query=${encodeURIComponent(query)}` : ""
        }`,
      serializeQueryArgs: ({ endpointName, queryArgs }) =>
        `${endpointName}:${queryArgs.category}:${queryArgs.query}`,
      transformResponse: (response: Tag[], _, { page }) => ({
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
