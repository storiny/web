import {
  decrementAction,
  incrementAction,
  setSelfPendingDraftCount,
  setSelfPublishedStoryCount
} from "~/redux/features";
import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string => `me/stories/${id}/publish`;

export interface StoryPublishResponse {}
export interface StoryPublishPayload {
  id: string;
  status: "draft" | "published";
}

export const { useStoryPublishMutation } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    storyPublish: builder.mutation<StoryPublishResponse, StoryPublishPayload>({
      query: (body) => ({
        url: `/${SEGMENT(body.id)}`,
        method: body.status === "draft" ? "POST" : "PUT"
      }),
      invalidatesTags: (result, error, arg) => [{ type: "Story", id: arg.id }],
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        queryFulfilled.then(() => {
          if (arg.status === "draft") {
            // Story published
            dispatch(setSelfPendingDraftCount(decrementAction));
            dispatch(setSelfPublishedStoryCount(incrementAction));
          }
        });
      }
    })
  })
});
