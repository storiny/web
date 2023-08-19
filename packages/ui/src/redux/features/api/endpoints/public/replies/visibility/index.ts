import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string => `public/replies/${id}/visibility`;

export interface ReplyVisibilityResponse {}
export interface ReplyVisibilityPayload {
  hidden: boolean;
  id: string;
}

export const { useReplyVisibilityMutation } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    replyVisibility: builder.mutation<
      ReplyVisibilityResponse,
      ReplyVisibilityPayload
    >({
      query: (body) => ({
        url: `/${SEGMENT(body.id)}`,
        method: "POST"
      }),
      invalidatesTags: (result, error, arg) => [{ type: "Reply", id: arg.id }]
    })
  })
});
