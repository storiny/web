import { Reply } from "@storiny/types";

import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = "me/replies";
const ITEMS_PER_PAGE = 10;

export type GetRepliesResponse = Reply[];

export const getRepliesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getReplies: builder.query<
      { hasMore: boolean; items: Reply[] },
      {
        page: number;
        query?: string;
        sort: "recent" | "old" | `likes-${"dsc" | "asc"}`;
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
        hasMore: response.length === ITEMS_PER_PAGE
      }),
      merge: (currentCache, newItems) => {
        currentCache.items.push(...newItems.items);
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

export const { useGetRepliesQuery } = getRepliesApi;
