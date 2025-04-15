import { Story } from "@storiny/types";

import { merge_fn } from "~/redux/features";
import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "me/history";
const ITEMS_PER_PAGE = 10;

export type GetHistoryResponse = Story[];

export const { useGetHistoryQuery: use_get_history_query } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      getHistory: builder.query<
        { has_more: boolean; items: Story[]; page: number },
        { page: number; query?: string }
      >({
        query: ({ page, query }) =>
          `/${SEGMENT}?page=${page}${
            query ? `&query=${encodeURIComponent(query)}` : ""
          }`,
        serializeQueryArgs: ({ endpointName, queryArgs }) =>
          `${endpointName}:${queryArgs.query}`,
        transformResponse: (response: Story[], _, { page }) => ({
          page,
          items: response,
          has_more: response.length === ITEMS_PER_PAGE
        }),
        merge: (cache, data) => merge_fn(cache, data),
        forceRefetch: ({ currentArg, previousArg }) =>
          currentArg?.page !== previousArg?.page ||
          currentArg?.query !== previousArg?.query
      })
    })
  });
