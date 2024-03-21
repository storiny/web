import { Story } from "@storiny/types";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (tag_name: string): string => `tags/${tag_name}/stories`;
const ITEMS_PER_PAGE = 10;

export type GetTagStoriesResponse = Story[];

export const { useGetTagStoriesQuery: use_get_tag_stories_query } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      getTagStories: builder.query<
        { has_more: boolean; items: Story[] },
        { page: number; query?: string; sort: string; tag_name: string }
      >({
        query: ({ page, sort = "popular", tag_name, query }) =>
          `/${SEGMENT(tag_name)}?page=${page}&sort=${sort}${
            query ? `&query=${encodeURIComponent(query)}` : ""
          }`,
        serializeQueryArgs: ({ endpointName, queryArgs }) =>
          `${endpointName}:${queryArgs.tag_name}:${queryArgs.sort}:${queryArgs.query}`,
        transformResponse: (response: Story[]) => ({
          items: response,
          has_more: response.length === ITEMS_PER_PAGE
        }),
        merge: (current_cache, new_items) => {
          current_cache.items = current_cache.items.filter(
            (current_item) =>
              !new_items.items.some((item) => current_item.id === item.id)
          );
          current_cache.items.push(...new_items.items);
          current_cache.has_more = new_items.has_more;
        },
        forceRefetch: ({ currentArg, previousArg }) =>
          currentArg?.tag_name !== previousArg?.tag_name ||
          currentArg?.page !== previousArg?.page ||
          currentArg?.sort !== previousArg?.sort ||
          currentArg?.query !== previousArg?.query
      })
    })
  });
