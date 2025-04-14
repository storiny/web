import { StoryCategory } from "@storiny/shared";
import { Tag } from "@storiny/types";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "public/explore/tags";
const ITEMS_PER_PAGE = 10;

export type GetExploreTagsResponse = Tag[];

export const { useGetExploreTagsQuery: use_get_explore_tags_query } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      getExploreTags: builder.query<
        { has_more: boolean; items: Tag[] },
        { category?: StoryCategory | "all"; page: number; query?: string }
      >({
        query: ({ page, category = "all", query }) =>
          `/${SEGMENT}?page=${page}&category=${category}${
            query ? `&query=${encodeURIComponent(query)}` : ""
          }`,
        serializeQueryArgs: ({ endpointName, queryArgs }) =>
          `${endpointName}:${queryArgs.category}:${queryArgs.query}`,
        transformResponse: (response: Tag[]) => ({
          items: response,
          has_more: response.length === ITEMS_PER_PAGE
        }),
        merge: (current_cache, data) => {
          const new_items = data.items.filter(
            (data_item) =>
              !current_cache.items.some((item) => data_item.id === item.id)
          );

          current_cache.items.push(...new_items);
          current_cache.has_more =
            current_cache.has_more && new_items.length === ITEMS_PER_PAGE;
        },
        forceRefetch: ({ currentArg, previousArg }) =>
          currentArg?.page !== previousArg?.page ||
          currentArg?.category !== previousArg?.category ||
          currentArg?.query !== previousArg?.query
      })
    })
  });
