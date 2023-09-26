import { ContentType } from "@storiny/shared";

import { number_action, self_action } from "~/redux/features";
import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = "me/comments";

export interface CommentAddResponse {}
export interface CommentAddPayload {
  content: string;
  storyId: string;
}

export const { useAddCommentMutation } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    addComment: builder.mutation<CommentAddResponse, CommentAddPayload>({
      query: (body) => ({
        url: `/${SEGMENT}`,
        method: "POST",
        body,
        headers: {
          "Content-type": ContentType.JSON
        }
      }),
      invalidatesTags: ["Comment"],
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        queryFulfilled.then(() => {
          [
            number_action("story_comment_counts", arg.storyId, "increment"),
            self_action("self_comment_count", "increment")
          ].forEach(dispatch);
        });
      }
    })
  })
});
