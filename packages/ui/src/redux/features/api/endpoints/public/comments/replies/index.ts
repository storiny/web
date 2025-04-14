import { Reply } from "@storiny/types";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (comment_id: string): string =>
  `public/comments/${comment_id}/replies`;
const ITEMS_PER_PAGE = 10;

export type GetCommentReliesResponse = Reply[];

export const { useGetCommentRepliesQuery: use_get_comment_replies_query } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      getCommentReplies: builder.query<
        { has_more: boolean; items: Reply[] },
        {
          comment_id: string;
          page: number;
        }
      >({
        query: ({ comment_id, page }) => `/${SEGMENT(comment_id)}?page=${page}`,
        serializeQueryArgs: ({ endpointName, queryArgs }) =>
          `${endpointName}:${queryArgs.comment_id}`,
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
          currentArg?.comment_id !== previousArg?.comment_id ||
          currentArg?.page !== previousArg?.page
      })
    })
  });
