import { ContentType } from "@storiny/shared";

import { number_action, self_action } from "~/redux/features";
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
      invalidatesTags: ["Reply"],
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        queryFulfilled.then(() => {
          [
            number_action("comment_reply_counts", arg.commentId, "increment"),
            self_action("self_reply_count", "increment")
          ].forEach(dispatch);
        });
      }
    })
  })
});
