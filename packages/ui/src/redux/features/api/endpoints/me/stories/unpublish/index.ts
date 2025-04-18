import { self_action } from "~/redux/features";
import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string => `me/stories/${id}/unpublish`;

export interface StoryUnpublishPayload {
  id: string;
}

export const { useUnpublishStoryMutation: use_unpublish_story_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      unpublishStory: builder.mutation<void, StoryUnpublishPayload>({
        query: (body) => ({
          url: `/${SEGMENT(body.id)}`,
          method: "POST"
        }),
        invalidatesTags: (_result, _error, arg) => [
          { type: "Story", id: arg.id }
        ],
        onQueryStarted: async (_arg, { dispatch, queryFulfilled }) => {
          queryFulfilled.then(() => {
            [
              self_action("self_published_story_count", "decrement"),
              self_action("self_pending_draft_count", "increment")
            ].forEach(dispatch);
          });
        }
      })
    })
  });
