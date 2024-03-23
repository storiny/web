import { DocUserRole, User } from "@storiny/types";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (story_id: string): string =>
  `me/stories/${story_id}/contributors`;

export type GetStoryContributorsResponse = {
  created_at: string;
  has_accepted: boolean;
  id: string;
  role: Omit<DocUserRole, "reader" | "blog-member">;
  user: User | null;
  user_id: string;
}[];

export const get_story_contributors_api = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    getStoryContributors: builder.query<
      GetStoryContributorsResponse,
      { story_id: string }
    >({
      query: ({ story_id }) => `/${SEGMENT(story_id)}`,
      serializeQueryArgs: ({ endpointName, queryArgs }) =>
        `${endpointName}:${queryArgs.story_id}`,
      forceRefetch: ({ currentArg, previousArg }) =>
        currentArg?.story_id !== previousArg?.story_id
    })
  })
});

export const {
  useGetStoryContributorsQuery: use_get_story_contributors_query
} = get_story_contributors_api;
