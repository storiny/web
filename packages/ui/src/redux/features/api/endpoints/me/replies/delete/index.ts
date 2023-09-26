import { number_action, self_action } from "~/redux/features";
import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string => `me/replies/${id}`;

export interface ReplyDeleteResponse {}
export interface ReplyDeletePayload {
  commentId: string;
  id: string;
}

export const { useDeleteReplyMutation } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    deleteReply: builder.mutation<ReplyDeleteResponse, ReplyDeletePayload>({
      query: (body) => ({
        url: `/${SEGMENT(body.id)}`,
        method: "DELETE"
      }),
      invalidatesTags: (result, error, arg) => [{ type: "Reply", id: arg.id }],
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        queryFulfilled.then(() => {
          [
            number_action("comment_reply_counts", arg.commentId, "decrement"),
            self_action("self_reply_count", "decrement")
          ].forEach(dispatch);
        });
      }
    })
  })
});
