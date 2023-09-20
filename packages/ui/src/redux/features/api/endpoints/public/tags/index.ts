import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = "public/tags";

export type GetTagsResponse = { label: string; value: string }[];

export const { useGetTagsQuery, useLazyGetTagsQuery } =
  apiSlice.injectEndpoints({
    endpoints: (builder) => ({
      getTags: builder.query<GetTagsResponse, { query: string }>({
        query: ({ query }) => `/${SEGMENT}?query=${encodeURIComponent(query)}`,
        serializeQueryArgs: ({ endpointName, queryArgs }) =>
          `${endpointName}:${queryArgs.query}`,
        merge: (currentCache, newItems) => {
          currentCache.push(...newItems);
        },
        forceRefetch: ({ currentArg, previousArg }) =>
          currentArg?.query !== previousArg?.query
      })
    })
  });
