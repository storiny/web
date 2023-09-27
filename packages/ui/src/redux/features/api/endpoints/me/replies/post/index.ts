import { ContentType } from "@storiny/shared";

import { number_action, self_action } from "~/redux/features";
import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "me/replies";

export interface ReplyAddPayload {
  comment_id: string;
  content: string;
}

export const { useAddReplyMutation: use_add_reply_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      addReply: builder.mutation<void, ReplyAddPayload>({
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
              number_action(
                "comment_reply_counts",
                arg.comment_id,
                "increment"
              ),
              self_action("self_reply_count", "increment")
            ].forEach(dispatch);
          });
        }
      })
    })
  });
