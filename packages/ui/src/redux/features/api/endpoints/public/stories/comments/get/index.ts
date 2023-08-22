import { Comment } from "@storiny/types";

import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = (storyId: string): string =>
  `public/stories/${storyId}/comments`;
const ITEMS_PER_PAGE = 10;

export type GetStoryCommentsResponse = Comment[];

export const { useGetStoryCommentsQuery } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getStoryComments: builder.query<
      { hasMore: boolean; items: Comment[] },
      {
        page: number;
        query?: string;
        sort:
          | "recent"
          | "old"
          | `replies-${"dsc" | "asc"}`
          | `likes-${"dsc" | "asc"}`;
        storyId: string;
        type: "all" | "hidden";
      }
    >({
      query: ({ storyId, type, page, sort, query }) =>
        `/${SEGMENT(storyId)}?type=${type}&page=${page}&sort=${sort}${
          query ? `&query=${encodeURIComponent(query)}` : ""
        }`,
      serializeQueryArgs: ({ endpointName, queryArgs }) =>
        `${endpointName}:${queryArgs.storyId}:${queryArgs.type}:${queryArgs.sort}:${queryArgs.query}`,
      transformResponse: (response: Comment[]) => ({
        items: response,
        hasMore: response.length === ITEMS_PER_PAGE
      }),
      merge: (currentCache, newItems) => {
        currentCache.items.push(...newItems.items);
        currentCache.hasMore = newItems.hasMore;
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
        currentArg?.storyId !== previousArg?.storyId ||
        currentArg?.type !== previousArg?.type ||
        currentArg?.page !== previousArg?.page ||
        currentArg?.sort !== previousArg?.sort ||
        currentArg?.query !== previousArg?.query
    })
  })
});
