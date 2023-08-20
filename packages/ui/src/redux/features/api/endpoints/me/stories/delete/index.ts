import {
  decrementAction,
  incrementAction,
  setSelfDeletedStoryCount,
  setSelfPublishedStoryCount
} from "~/redux/features";
import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string => `me/stories/${id}`;

export interface StoryDeleteResponse {}
export interface StoryDeletePayload {
  id: string;
}

export const { useStoryDeleteMutation } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    storyDelete: builder.mutation<StoryDeleteResponse, StoryDeletePayload>({
      query: (body) => ({
        url: `/${SEGMENT(body.id)}`,
        method: "DELETE"
      }),
      invalidatesTags: (result, error, arg) => [{ type: "Story", id: arg.id }],
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        queryFulfilled.then(() => {
          dispatch(setSelfPublishedStoryCount(decrementAction));
          dispatch(setSelfDeletedStoryCount(incrementAction));
        });
      }
    })
  })
});
