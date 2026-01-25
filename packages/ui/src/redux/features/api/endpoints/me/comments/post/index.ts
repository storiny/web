import { ContentType } from "@storiny/shared";

import { number_action, self_action } from "~/redux/features";
import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "me/comments";

export interface CommentAddPayload {
  content: string;
  story_id: string;
}

export const { useAddCommentMutation: use_add_comment_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      addComment: builder.mutation<void, CommentAddPayload>({
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
              number_action("story_comment_counts", arg.story_id, "increment"),
              self_action("self_comment_count", "increment")
            ].forEach(dispatch);
          });
        }
      })
    })
  });
