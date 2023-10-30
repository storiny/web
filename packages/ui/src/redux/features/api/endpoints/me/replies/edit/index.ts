import { ContentType } from "@storiny/shared";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string => `me/replies/${id}`;

export interface ReplyEditPayload {
  content: string;
  id: string;
}

export const { useEditReplyMutation: use_edit_reply_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      editReply: builder.mutation<void, ReplyEditPayload>({
        query: (body) => ({
          url: `/${SEGMENT(body.id)}`,
          method: "PATCH",
          body: { content: body.content },
          headers: {
            "Content-type": ContentType.JSON
          }
        }),
        invalidatesTags: (result, error, arg) => [{ type: "Reply", id: arg.id }]
      })
    })
  });
