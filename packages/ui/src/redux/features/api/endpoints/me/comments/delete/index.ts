import { decrementAction, setStoryCommentCount } from "~/redux/features";
import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string => `me/comments/${id}`;

export interface CommentDeleteResponse {}
export interface CommentDeletePayload {
  id: string;
  storyId: string;
}

export const { useCommentDeleteMutation } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    commentDelete: builder.mutation<
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
          dispatch(setStoryCommentCount([arg.storyId, decrementAction]));
        });
      }
    })
  })
});
