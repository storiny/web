import { number_action, self_action } from "~/redux/features";
import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string => `me/replies/${id}`;

export interface ReplyDeletePayload {
  comment_id: string;
  id: string;
}

export const { useDeleteReplyMutation: use_delete_reply_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      deleteReply: builder.mutation<void, ReplyDeletePayload>({
        query: (body) => ({
          url: `/${SEGMENT(body.id)}`,
          method: "DELETE"
        }),
        invalidatesTags: (_result, _error, arg) => [
          { type: "Reply", id: arg.id }
        ],
        onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
          queryFulfilled.then(() => {
            [
              number_action(
                "comment_reply_counts",
                arg.comment_id,
                "decrement"
              ),
              self_action("self_reply_count", "decrement")
            ].forEach(dispatch);
          });
        }
      })
    })
  });
