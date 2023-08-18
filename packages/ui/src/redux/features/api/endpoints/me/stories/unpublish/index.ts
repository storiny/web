import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string => `me/stories/${id}/unpublish`;

export interface StoryUnpublishResponse {}
export interface StoryUnpublishPayload {
  id: string;
}

export const { useStoryUnpublishMutation } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    storyUnpublish: builder.mutation<
      StoryUnpublishResponse,
      StoryUnpublishPayload
    >({
      query: (body) => ({
        url: `/${SEGMENT(body.id)}`,
        method: "POST"
      }),
      invalidatesTags: (result, error, arg) => [{ type: "Story", id: arg.id }]
    })
  })
});
