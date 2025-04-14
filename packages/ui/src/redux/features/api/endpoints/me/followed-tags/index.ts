import { Tag } from "@storiny/types";
import { TagsSortValue } from "@storiny/web/src/app/(native)/(check-user)/(dashboard)/(splash)/me/(default-rsb)/content/tags/client";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "me/followed-tags";
const ITEMS_PER_PAGE = 10;

export type GetFollowedTagsResponse = Tag[];

export const { useGetFollowedTagsQuery: use_get_followed_tags_query } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      getFollowedTags: builder.query<
        { has_more: boolean; items: Tag[] },
        { page: number; query?: string; sort: TagsSortValue }
      >({
        query: ({ page, sort, query }) =>
          `/${SEGMENT}?page=${page}&sort=${sort}${
            query ? `&query=${encodeURIComponent(query)}` : ""
          }`,
        serializeQueryArgs: ({ endpointName, queryArgs }) =>
          `${endpointName}:${queryArgs.sort}:${queryArgs.query}`,
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
          current_cache.has_more = new_items.length === ITEMS_PER_PAGE;
        },
        forceRefetch: ({ currentArg, previousArg }) =>
          currentArg?.page !== previousArg?.page ||
          currentArg?.sort !== previousArg?.sort ||
          currentArg?.query !== previousArg?.query
      })
    })
  });
