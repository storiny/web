import { self_action } from "~/redux/features";
import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string => `me/stories/${id}`;

export interface StoryDeleteResponse {}
export interface StoryDeletePayload {
  id: string;
}

export const { useDeleteStoryMutation } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    deleteStory: builder.mutation<StoryDeleteResponse, StoryDeletePayload>({
      query: (body) => ({
        url: `/${SEGMENT(body.id)}`,
        method: "DELETE"
      }),
      invalidatesTags: (result, error, arg) => [{ type: "Story", id: arg.id }],
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        queryFulfilled.then(() => {
          [
            self_action("self_published_story_count", "decrement"),
            self_action("self_deleted_story_count", "increment")
          ].forEach(dispatch);
        });
      }
    })
  })
});
