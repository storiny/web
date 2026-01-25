import { StoryCategory } from "@storiny/shared";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "me/flow/onboarding/tags";

export type GetOnboardingTagsResponse = {
  category: StoryCategory;
  tags: { id: string; name: string }[];
}[];

export const { useGetOnboardingTagsQuery: use_get_onboarding_tags_query } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      getOnboardingTags: builder.query<GetOnboardingTagsResponse, string>({
        query: (hash) => `/${SEGMENT}?encoded_categories=${hash}`,
        serializeQueryArgs: ({ endpointName, queryArgs }) =>
          `${endpointName}:${queryArgs}`,
        forceRefetch: ({ currentArg, previousArg }) =>
          currentArg !== previousArg
      })
    })
  });
