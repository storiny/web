import { number_action, self_action } from "~/redux/features";
import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string => `me/comments/${id}`;

export interface CommentDeleteResponse {}
export interface CommentDeletePayload {
  id: string;
  storyId: string;
}

export const { useDeleteCommentMutation } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    deleteComment: builder.mutation<
      CommentDeleteResponse,
      CommentDeletePayload
    >({
      query: (body) => ({
        url: `/${SEGMENT(body.id)}`,
        method: "DELETE"
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "Comment", id: arg.id }
      ],
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        queryFulfilled.then(() => {
          [
            number_action("story_comment_counts", arg.storyId, "decrement"),
            self_action("self_comment_count", "decrement")
          ].forEach(dispatch);
        });
      }
    })
  })
});
