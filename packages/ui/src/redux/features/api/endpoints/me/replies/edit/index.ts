import { ContentType } from "@storiny/shared";

import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string => `me/replies/${id}/edit`;

export interface ReplyEditResponse {}
export interface ReplyEditPayload {
  content: string;
  id: string;
}

export const { useReplyEditMutation } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    replyEdit: builder.mutation<ReplyEditResponse, ReplyEditPayload>({
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
