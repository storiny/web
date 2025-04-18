import { Story } from "@storiny/types";
import { StoriesSortValue } from "@storiny/web/src/app/(native)/(check-user)/(dashboard)/(splash)/me/content/stories/client";

import { merge_fn } from "~/redux/features";
import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "me/stories";
const ITEMS_PER_PAGE = 10;

export type GetStoriesResponse = Story[];

export const get_stories_api = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    getStories: builder.query<
      { has_more: boolean; items: Story[]; page: number },
      {
        page: number;
        query?: string;
        sort: StoriesSortValue;
        type: "published" | "deleted";
      }
    >({
      query: ({ page, sort, query, type }) =>
        `/${SEGMENT}?type=${type}&page=${page}&sort=${sort}${
          query ? `&query=${encodeURIComponent(query)}` : ""
        }`,
      serializeQueryArgs: ({ endpointName, queryArgs }) =>
        `${endpointName}:${queryArgs.type}:${queryArgs.sort}:${queryArgs.query}`,
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
        currentArg?.type !== previousArg?.type ||
        currentArg?.page !== previousArg?.page ||
        currentArg?.sort !== previousArg?.sort ||
        currentArg?.query !== previousArg?.query
    })
  })
});

export const {
  useLazyGetStoriesQuery: use_get_stories_query,
  endpoints: {
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    getStories: { select: select_stories }
  }
} = get_stories_api;
