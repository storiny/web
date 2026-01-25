import { User } from "@storiny/types";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "me/flow/onboarding/writers";

export type GetOnboardingWritersResponse = User[];

export const {
  useGetOnboardingWritersQuery: use_get_onboarding_writers_query
} = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    getOnboardingWriters: builder.query<GetOnboardingWritersResponse, string>({
      query: (hash) => `/${SEGMENT}?encoded_categories=${hash}`,
      serializeQueryArgs: ({ endpointName, queryArgs }) =>
        `${endpointName}:${queryArgs}`,
      forceRefetch: ({ currentArg, previousArg }) => currentArg !== previousArg
    })
  })
});
