import { StoryCategory } from "@storiny/shared";

import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = "me/flow/onboarding/tags";

export type GetOnboardingTagsResponse = Record<
  StoryCategory,
  { id: string; name: string }[]
>;

export const { useGetOnboardingTagsQuery } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getOnboardingTags: builder.query<GetOnboardingTagsResponse, string>({
      query: (hash) => `/${SEGMENT}?categories_hash=${hash}`,
      serializeQueryArgs: ({ endpointName, queryArgs }) =>
        `${endpointName}:${queryArgs}`,
      forceRefetch: ({ currentArg, previousArg }) => currentArg !== previousArg
    })
  })
});
