import { number_action, self_action } from "~/redux/features";
import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string => `me/comments/${id}`;

export interface CommentDeletePayload {
  id: string;
  story_id: string;
}

export const { useDeleteCommentMutation: use_delete_comment_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      deleteComment: builder.mutation<void, CommentDeletePayload>({
        query: (body) => ({
          url: `/${SEGMENT(body.id)}`,
          method: "DELETE"
        }),
        invalidatesTags: (_result, _error, arg) => [
          { type: "Comment", id: arg.id }
        ],
        onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
          queryFulfilled.then(() => {
            [
              number_action("story_comment_counts", arg.story_id, "decrement"),
              self_action("self_comment_count", "decrement")
            ].forEach(dispatch);
          });
        }
      })
    })
  });
