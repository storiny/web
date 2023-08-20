import {
  decrementAction,
  setCommentReplyCount,
  setSelfReplyCount
} from "~/redux/features";
import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string => `me/replies/${id}`;

export interface ReplyDeleteResponse {}
export interface ReplyDeletePayload {
  commentId: string;
  id: string;
}

export const { useReplyDeleteMutation } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    replyDelete: builder.mutation<ReplyDeleteResponse, ReplyDeletePayload>({
      query: (body) => ({
        url: `/${SEGMENT(body.id)}`,
        method: "DELETE"
      }),
      invalidatesTags: (result, error, arg) => [{ type: "Reply", id: arg.id }],
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        queryFulfilled.then(() => {
          dispatch(setCommentReplyCount([arg.commentId, decrementAction]));
          dispatch(setSelfReplyCount(decrementAction));
        });
      }
    })
  })
});
