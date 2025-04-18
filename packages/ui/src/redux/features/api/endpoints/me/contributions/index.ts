import { Story } from "@storiny/types";

import { merge_fn } from "~/redux/features";
import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "me/contributions";
const ITEMS_PER_PAGE = 10;

export type GetContributionsResponse = Story[];

export const get_contributions_api = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    getContributions: builder.query<
      { has_more: boolean; items: Story[]; page: number },
      { page: number; query?: string; sort: "recent" | "old" }
    >({
      query: ({ page, sort, query }) =>
        `/${SEGMENT}?page=${page}&sort=${sort}${
          query ? `&query=${encodeURIComponent(query)}` : ""
        }`,
      serializeQueryArgs: ({ endpointName, queryArgs }) =>
        `${endpointName}:${queryArgs.sort}:${queryArgs.query}`,
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
  useLazyGetContributionsQuery: use_get_contributions_query,
  endpoints: {
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    getContributions: { select: select_contributions }
  }
} = get_contributions_api;
