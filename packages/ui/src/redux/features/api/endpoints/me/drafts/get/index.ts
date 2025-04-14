import { Story } from "@storiny/types";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "me/drafts";
const ITEMS_PER_PAGE = 10;

export type GetDraftsResponse = Story[];

export const get_drafts_api = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    getDrafts: builder.query<
      { has_more: boolean; items: Story[] },
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
        current_cache.has_more = new_items.length === ITEMS_PER_PAGE;
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
        currentArg?.type !== previousArg?.type ||
        currentArg?.page !== previousArg?.page ||
        currentArg?.sort !== previousArg?.sort ||
        currentArg?.query !== previousArg?.query
    })
  })
});

export const { useGetDraftsQuery: use_get_drafts_query } = get_drafts_api;
