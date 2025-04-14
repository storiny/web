import { Reply } from "@storiny/types";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "me/replies";
const ITEMS_PER_PAGE = 10;

export type GetRepliesResponse = Reply[];

export const get_replies_api = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    getReplies: builder.query<
      { has_more: boolean; items: Reply[] },
      {
        page: number;
        query?: string;
        sort: "recent" | "old" | `${"least" | "most"}-liked`;
      }
    >({
      query: ({ page, sort, query }) =>
        `/${SEGMENT}?page=${page}&sort=${sort}${
          query ? `&query=${encodeURIComponent(query)}` : ""
        }`,
      serializeQueryArgs: ({ endpointName, queryArgs }) =>
        `${endpointName}:${queryArgs.sort}:${queryArgs.query}`,
      transformResponse: (response: Reply[]) => ({
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
                type: "Reply" as const,
                id
              })),
              "Reply"
            ]
          : ["Reply"],
      forceRefetch: ({ currentArg, previousArg }) =>
        currentArg?.page !== previousArg?.page ||
        currentArg?.sort !== previousArg?.sort ||
        currentArg?.query !== previousArg?.query
    })
  })
});

export const { useGetRepliesQuery: use_get_replies_query } = get_replies_api;
