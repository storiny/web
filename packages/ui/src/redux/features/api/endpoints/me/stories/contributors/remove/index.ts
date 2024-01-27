import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (story_id: string, user_id: string): string =>
  `me/stories/${story_id}/contributors/${user_id}`;

export interface RemoveContributorPayload {
  story_id: string;
  user_id: string;
}

export const { useRemoveContributorMutation: use_remove_contributor_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      removeContributor: builder.mutation<void, RemoveContributorPayload>({
        query: ({ story_id, user_id }) => ({
          url: `/${SEGMENT(story_id, user_id)}`,
          method: "DELETE"
        })
      })
    })
  });
