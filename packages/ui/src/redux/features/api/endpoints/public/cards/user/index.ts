import { User } from "@storiny/types";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (identifier: string): string =>
  `public/cards/user/${identifier}`;

export type GetUserCardResponse = User;

export const { useGetUserCardQuery: use_get_user_card_query } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      getUserCard: builder.query<User, string>({
        query: (identifier) => `/${SEGMENT(identifier)}`,
        serializeQueryArgs: ({ endpointName, queryArgs }) =>
          `${endpointName}:${queryArgs}`,
        forceRefetch: ({ currentArg, previousArg }) =>
          currentArg !== previousArg
      })
    })
  });
