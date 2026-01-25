import { Story } from "@storiny/types";

import { merge_fn } from "~/redux/features";
import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "me/drafts";
const ITEMS_PER_PAGE = 10;

export type GetDraftsResponse = Story[];

export const get_drafts_api = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    getDrafts: builder.query<
      { has_more: boolean; items: Story[]; page: number },
      {
        page: number;
        query?: string;
        sort: "recent" | "old";
        type: "pending" | "deleted";
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
  useLazyGetDraftsQuery: use_get_drafts_query,
  endpoints: {
    getDrafts: { select: select_drafts }
  }
} = get_drafts_api;
