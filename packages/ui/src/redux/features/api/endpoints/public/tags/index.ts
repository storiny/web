import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "public/tags";

export type GetTagsResponse = string[];

export const { useLazyGetTagsQuery: use_lazy_get_tags_query } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      getTags: builder.query<GetTagsResponse, { query: string }>({
        query: ({ query }) => `/${SEGMENT}?query=${encodeURIComponent(query)}`,
        serializeQueryArgs: ({ endpointName, queryArgs }) =>
          `${endpointName}:${queryArgs.query}`,
        merge: (current_cache, new_items) => {
          current_cache.push(...new_items);
        },
        forceRefetch: ({ currentArg, previousArg }) =>
          currentArg?.query !== previousArg?.query
      })
    })
  });
