import { self_action } from "~/redux/features";
import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string => `me/stories/${id}/publish`;

export interface StoryPublishPayload {
  id: string;
  status: "draft" | "published";
}

export const { usePublishStoryMutation: use_publish_story_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      publishStory: builder.mutation<void, StoryPublishPayload>({
        query: (body) => ({
          url: `/${SEGMENT(body.id)}`,
          method: body.status === "draft" ? "POST" : "PUT"
        }),
        invalidatesTags: (result, error, arg) => [
          { type: "Story", id: arg.id }
        ],
        onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
          queryFulfilled.then(() => {
            if (arg.status === "draft") {
              // Story published
              [
                self_action("self_pending_draft_count", "decrement"),
                self_action("self_published_story_count", "increment")
              ].forEach(dispatch);
            }
          });
        }
      })
    })
  });
