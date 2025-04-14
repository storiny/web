import { StoryCategory } from "@storiny/shared";
import { User } from "@storiny/types";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "public/explore/writers";
const ITEMS_PER_PAGE = 10;

export type GetExploreWritersResponse = User[];

export const { useGetExploreWritersQuery: use_get_explore_writers_query } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      getExploreWriters: builder.query<
        { has_more: boolean; items: User[] },
        { category?: StoryCategory | "all"; page: number; query?: string }
      >({
        query: ({ page, category = "all", query }) =>
          `/${SEGMENT}?page=${page}&category=${category}${
            query ? `&query=${encodeURIComponent(query)}` : ""
          }`,
        serializeQueryArgs: ({ endpointName, queryArgs }) =>
          `${endpointName}:${queryArgs.category}:${queryArgs.query}`,
        transformResponse: (response: User[]) => ({
          items: response,
          has_more: response.length === ITEMS_PER_PAGE
        }),
        merge: (current_cache, data) => {
          const new_items = data.items.filter(
            (data_item) =>
              !current_cache.items.some((item) => data_item.id === item.id)
          );

          current_cache.items.push(...new_items);
          current_cache.has_more = new_items.length === ITEMS_PER_PAGE;
        },
        forceRefetch: ({ currentArg, previousArg }) =>
          currentArg?.page !== previousArg?.page ||
          currentArg?.category !== previousArg?.category ||
          currentArg?.query !== previousArg?.query
      })
    })
  });
