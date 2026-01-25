import { ContentType } from "@storiny/shared";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string => `public/replies/${id}/visibility`;

export interface ReplyVisibilityPayload {
  hidden: boolean;
  id: string;
}

export const { useReplyVisibilityMutation: use_reply_visibility_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      replyVisibility: builder.mutation<void, ReplyVisibilityPayload>({
        query: (body) => ({
          url: `/${SEGMENT(body.id)}`,
          method: "POST",
          body: { hidden: body.hidden },
          headers: { "Content-type": ContentType.JSON }
        }),
        invalidatesTags: (_result, _error, arg) => [
          { type: "Reply", id: arg.id }
        ]
      })
    })
  });
