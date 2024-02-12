import { User } from "@storiny/types";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "me/lookup/username";

export type LookupUsernameResponse = User[];

export const { useLazyLookupUsernameQuery: use_lazy_lookup_username_query } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      lookupUsername: builder.query<
        LookupUsernameResponse,
        {
          query: string;
        }
      >({
        query: ({ query }) => `/${SEGMENT}?query=${encodeURIComponent(query)}`,
        serializeQueryArgs: ({ endpointName, queryArgs }) =>
          `${endpointName}:${queryArgs.query}`,
        forceRefetch: ({ currentArg, previousArg }) =>
          currentArg?.query !== previousArg?.query
      })
    })
  });
