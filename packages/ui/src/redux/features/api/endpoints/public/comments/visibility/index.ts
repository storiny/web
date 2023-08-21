import {
  decrementAction,
  incrementAction,
  setStoryHiddenCommentCount
} from "~/redux/features";
import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string => `public/comments/${id}/visibility`;

export interface CommentVisibilityResponse {}
export interface CommentVisibilityPayload {
  hidden: boolean;
  id: string;
  storyId: string;
}

export const { useCommentVisibilityMutation } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    commentVisibility: builder.mutation<
      CommentVisibilityResponse,
      CommentVisibilityPayload
    >({
      query: (body) => ({
        url: `/${SEGMENT(body.id)}`,
        method: "POST"
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "Comment", id: arg.id }
      ],
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        queryFulfilled.then(() => {
          dispatch(
            setStoryHiddenCommentCount([
              arg.storyId,
              arg.hidden ? incrementAction : decrementAction
            ])
          );
        });
      }
    })
  })
});
