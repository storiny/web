import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string => `public/replies/${id}/visibility`;

export interface ReplyVisibilityPayload {
  hidden: boolean;
  id: string;
}

export const { useReplyVisibilityMutation: use_reply_visibility_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      replyVisibility: builder.mutation<void, ReplyVisibilityPayload>({
        query: (body) => ({
          url: `/${SEGMENT(body.id)}`,
          method: "POST"
        }),
        invalidatesTags: (result, error, arg) => [{ type: "Reply", id: arg.id }]
      })
    })
  });
