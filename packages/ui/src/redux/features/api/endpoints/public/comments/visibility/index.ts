import { ContentType } from "@storiny/shared";

import { number_action } from "~/redux/features";
import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string => `public/comments/${id}/visibility`;

export interface CommentVisibilityPayload {
  hidden: boolean;
  id: string;
  story_id: string;
}

export const { useCommentVisibilityMutation: use_comment_visibility_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      commentVisibility: builder.mutation<void, CommentVisibilityPayload>({
        query: (body) => ({
          url: `/${SEGMENT(body.id)}`,
          body: { hidden: body.hidden },
          method: "POST",
          headers: {
            "Content-type": ContentType.JSON
          }
        }),
        invalidatesTags: (result, error, arg) => [
          { type: "Comment", id: arg.id }
        ],
        onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
          queryFulfilled.then(() => {
            dispatch(
              number_action(
                "story_hidden_comment_counts",
                arg.story_id,
                arg.hidden ? "increment" : "decrement"
              )
            );
          });
        }
      })
    })
  });
