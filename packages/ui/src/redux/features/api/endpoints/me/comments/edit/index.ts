import { ContentType } from "@storiny/shared";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string => `me/comments/${id}`;

export interface CommentEditPayload {
  content: string;
  id: string;
}

export const { useEditCommentMutation: use_edit_comment_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      editComment: builder.mutation<void, CommentEditPayload>({
        query: (body) => ({
          url: `/${SEGMENT(body.id)}`,
          method: "PATCH",
          body: { content: body.content },
          headers: {
            "Content-type": ContentType.JSON
          }
        }),
        invalidatesTags: (result, error, arg) => [
          { type: "Comment", id: arg.id }
        ]
      })
    })
  });
