import { Story } from "@storiny/types";

import { merge_fn } from "~/redux/features";
import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (tag_name: string): string => `tags/${tag_name}/stories`;
const ITEMS_PER_PAGE = 10;

export type GetTagStoriesResponse = Story[];

export const {
  useLazyGetTagStoriesQuery: use_get_tag_stories_query,
  endpoints: {
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    getTagStories: { select: select_tag_stories }
  }
} = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    getTagStories: builder.query<
      { has_more: boolean; items: Story[]; page: number },
      { page: number; query?: string; sort: string; tag_name: string }
    >({
      query: ({ page, sort = "popular", tag_name, query }) =>
        `/${SEGMENT(tag_name)}?page=${page}&sort=${sort}${
          query ? `&query=${encodeURIComponent(query)}` : ""
        }`,
      serializeQueryArgs: ({ endpointName, queryArgs }) =>
        `${endpointName}:${queryArgs.tag_name}:${queryArgs.sort}:${queryArgs.query}`,
      transformResponse: (response: Story[], _, { page }) => ({
        page,
        items: response,
        has_more: response.length === ITEMS_PER_PAGE
      }),
      merge: (cache, data) => merge_fn(cache, data),
      forceRefetch: ({ currentArg, previousArg }) =>
        currentArg?.tag_name !== previousArg?.tag_name ||
        currentArg?.page !== previousArg?.page ||
        currentArg?.sort !== previousArg?.sort ||
        currentArg?.query !== previousArg?.query
    })
  })
});
