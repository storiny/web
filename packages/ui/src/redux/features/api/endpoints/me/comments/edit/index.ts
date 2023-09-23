import { ContentType } from "@storiny/shared";

import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string => `me/comments/${id}/edit`;

export interface CommentEditResponse {}
export interface CommentEditPayload {
  content: string;
  id: string;
}

export const { useEditCommentMutation } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    editComment: builder.mutation<CommentEditResponse, CommentEditPayload>({
      query: (body) => ({
        url: `/${SEGMENT(body.id)}`,
        method: "PATCH",
        body: { content: body.content },
        headers: {
          "Content-type": ContentType.JSON
        }
      }),
      invalidatesTags: (result, error, arg) => [{ type: "Comment", id: arg.id }]
    })
  })
});
