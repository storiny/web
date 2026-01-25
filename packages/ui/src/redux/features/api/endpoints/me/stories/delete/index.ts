import { self_action } from "~/redux/features";
import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string => `me/stories/${id}`;

export interface StoryDeletePayload {
  id: string;
}

export const { useDeleteStoryMutation: use_delete_story_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      deleteStory: builder.mutation<void, StoryDeletePayload>({
        query: (body) => ({
          url: `/${SEGMENT(body.id)}`,
          method: "DELETE"
        }),
        invalidatesTags: (_result, _error, arg) => [
          { type: "Story", id: arg.id }
        ],
        onQueryStarted: async (_arg, { dispatch, queryFulfilled }) => {
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
