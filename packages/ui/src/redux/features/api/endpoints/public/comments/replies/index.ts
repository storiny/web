import { Reply } from "@storiny/types";

import { merge_fn } from "~/redux/features";
import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (comment_id: string): string =>
  `public/comments/${comment_id}/replies`;
const ITEMS_PER_PAGE = 10;

export type GetCommentReliesResponse = Reply[];

export const {
  useLazyGetCommentRepliesQuery: use_get_comment_replies_query,
  endpoints: {
    getCommentReplies: { select: select_comment_replies }
  }
} = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    getCommentReplies: builder.query<
      { has_more: boolean; items: Reply[]; page: number },
      { comment_id: string; page: number }
    >({
      query: ({ comment_id, page }) => `/${SEGMENT(comment_id)}?page=${page}`,
      serializeQueryArgs: ({ endpointName, queryArgs }) =>
        `${endpointName}:${queryArgs.comment_id}`,
      transformResponse: (response: Reply[], _, { page }) => ({
        page,
        items: response,
        has_more: response.length === ITEMS_PER_PAGE
      }),
      merge: (cache, data) => merge_fn(cache, data),
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
        currentArg?.comment_id !== previousArg?.comment_id ||
        currentArg?.page !== previousArg?.page
    })
  })
});
