import { User } from "@storiny/types";

import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = "me/flow/onboarding/writers";

export type GetOnboardingWritersResponse = User[];

export const { useGetOnboardingWritersQuery } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getOnboardingWriters: builder.query<GetOnboardingWritersResponse, string>({
      query: (hash) => `/${SEGMENT}?categories_hash=${hash}`,
      serializeQueryArgs: ({ endpointName, queryArgs }) =>
        `${endpointName}:${queryArgs}`,
      forceRefetch: ({ currentArg, previousArg }) => currentArg !== previousArg
    })
  })
});
