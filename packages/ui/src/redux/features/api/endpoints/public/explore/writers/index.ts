import { StoryCategory } from "@storiny/shared";
import { User } from "@storiny/types";

import { merge_fn } from "~/redux/features";
import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "public/explore/writers";
const ITEMS_PER_PAGE = 10;

export type GetExploreWritersResponse = User[];

export const { useGetExploreWritersQuery: use_get_explore_writers_query } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      getExploreWriters: builder.query<
        { has_more: boolean; items: User[]; page: number },
        { category?: StoryCategory | "all"; page: number; query?: string }
      >({
        query: ({ page, category = "all", query }) =>
          `/${SEGMENT}?page=${page}&category=${category}${
            query ? `&query=${encodeURIComponent(query)}` : ""
          }`,
        serializeQueryArgs: ({ endpointName, queryArgs }) =>
          `${endpointName}:${queryArgs.category}:${queryArgs.query}`,
        transformResponse: (response: User[], _, { page }) => ({
          page,
          items: response,
          has_more: response.length === ITEMS_PER_PAGE
        }),
        merge: (cache, data) => merge_fn(cache, data),
        forceRefetch: ({ currentArg, previousArg }) =>
          currentArg?.page !== previousArg?.page ||
          currentArg?.category !== previousArg?.category ||
          currentArg?.query !== previousArg?.query
      })
    })
  });
