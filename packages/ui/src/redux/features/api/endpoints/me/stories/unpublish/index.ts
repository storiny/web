import {
  decrementAction,
  incrementAction,
  setSelfPendingDraftCount,
  setSelfPublishedStoryCount
} from "~/redux/features";
import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string => `me/stories/${id}/unpublish`;

export interface StoryUnpublishResponse {}
export interface StoryUnpublishPayload {
  id: string;
}

export const { useUnpublishStoryMutation } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    unpublishStory: builder.mutation<
      StoryUnpublishResponse,
      StoryUnpublishPayload
    >({
      query: (body) => ({
        url: `/${SEGMENT(body.id)}`,
        method: "POST"
      }),
      invalidatesTags: (result, error, arg) => [{ type: "Story", id: arg.id }],
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        queryFulfilled.then(() => {
          dispatch(setSelfPublishedStoryCount(decrementAction));
          dispatch(setSelfPendingDraftCount(incrementAction));
        });
      }
    })
  })
});
