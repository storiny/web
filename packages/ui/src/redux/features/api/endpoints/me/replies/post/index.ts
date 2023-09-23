import { ContentType } from "@storiny/shared";

import {
  incrementAction,
  setCommentReplyCount,
  setSelfReplyCount
} from "~/redux/features";
import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = "me/replies";

export interface ReplyAddResponse {}
export interface ReplyAddPayload {
  commentId: string;
  content: string;
}

export const { useAddReplyMutation } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    addReply: builder.mutation<ReplyAddResponse, ReplyAddPayload>({
      query: (body) => ({
        url: `/${SEGMENT}`,
        method: "POST",
        body,
        headers: {
          "Content-type": ContentType.JSON
        }
      }),
      invalidatesTags: () => [{ type: "Reply" }],
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        queryFulfilled.then(() => {
          dispatch(setCommentReplyCount([arg.commentId, incrementAction]));
          dispatch(setSelfReplyCount(incrementAction));
        });
      }
    })
  })
});
