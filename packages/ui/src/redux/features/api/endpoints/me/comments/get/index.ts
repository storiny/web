import { Comment } from "@storiny/types";

import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = "me/comments";
const ITEMS_PER_PAGE = 10;

export type GetCommentsResponse = Comment[];

export const getCommentsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getComments: builder.query<
      { hasMore: boolean; items: Comment[] },
      {
        page: number;
        query?: string;
        sort:
          | "recent"
          | "old"
          | `replies-${"dsc" | "asc"}`
          | `likes-${"dsc" | "asc"}`;
      }
    >({
      query: ({ page, sort, query }) =>
        `/${SEGMENT}?page=${page}&sort=${sort}${
          query ? `&query=${encodeURIComponent(query)}` : ""
        }`,
      serializeQueryArgs: ({ endpointName, queryArgs }) =>
        `${endpointName}:${queryArgs.sort}:${queryArgs.query}`,
      transformResponse: (response: Comment[]) => ({
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
                type: "Comment" as const,
                id
              })),
              "Comment"
            ]
          : ["Comment"],
      forceRefetch: ({ currentArg, previousArg }) =>
        currentArg?.page !== previousArg?.page ||
        currentArg?.sort !== previousArg?.sort ||
        currentArg?.query !== previousArg?.query
    })
  })
});

export const { useGetCommentsQuery } = getCommentsApi;
