import { self_action } from "~/redux/features";
import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string => `me/stories/${id}/recover`;

export interface StoryRecoverPayload {
  id: string;
}

export const { useRecoverStoryMutation: use_recover_story_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      recoverStory: builder.mutation<void, StoryRecoverPayload>({
        query: (body) => ({
          url: `/${SEGMENT(body.id)}`,
          method: "POST"
        }),
        invalidatesTags: (result, error, arg) => [
          { type: "Story", id: arg.id }
        ],
        onQueryStarted: async (_, { dispatch, queryFulfilled }) => {
          queryFulfilled.then(() => {
            // Recovered story is moved into drafts
            [
              self_action("self_deleted_story_count", "decrement"),
              self_action("self_pending_draft_count", "increment")
            ].forEach(dispatch);
          });
        }
      })
    })
  });
