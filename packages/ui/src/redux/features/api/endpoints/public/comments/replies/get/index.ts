import { Reply } from "@storiny/types";

import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = (commentId: string): string =>
  `public/comments/${commentId}/replies`;
const ITEMS_PER_PAGE = 10;

export type GetCommentReliesResponse = Reply[];

export const getCommentRepliesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCommentReplies: builder.query<
      { hasMore: boolean; items: Reply[] },
      {
        commentId: string;
        page: number;
      }
    >({
      query: ({ commentId, page }) => `/${SEGMENT(commentId)}?page=${page}`,
      serializeQueryArgs: ({ endpointName, queryArgs }) =>
        `${endpointName}:${queryArgs.commentId}`,
      transformResponse: (response: Reply[]) => ({
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
                type: "Reply" as const,
                id
              })),
              "Reply"
            ]
          : ["Reply"],
      forceRefetch: ({ currentArg, previousArg }) =>
        currentArg?.commentId !== previousArg?.commentId ||
        currentArg?.page !== previousArg?.page
    })
  })
});

export const { useGetCommentRepliesQuery } = getCommentRepliesApi;
