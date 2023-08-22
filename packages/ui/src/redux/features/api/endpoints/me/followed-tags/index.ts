import { Tag } from "@storiny/types";
import { TagsSortValue } from "@storiny/web/src/app/(check-user)/(dashboard)/me/(splash)/(default-lsb)/(default-rsb)/content/tags/client";

import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = "me/followed-tags";
const ITEMS_PER_PAGE = 10;

export type GetTagsResponse = Tag[];

export const { useGetFollowedTagsQuery } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getFollowedTags: builder.query<
      { hasMore: boolean; items: Tag[] },
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
        hasMore: response.length === ITEMS_PER_PAGE
      }),
      merge: (currentCache, newItems) => {
        currentCache.items.push(...newItems.items);
        currentCache.hasMore = newItems.hasMore;
      },
      forceRefetch: ({ currentArg, previousArg }) =>
        currentArg?.page !== previousArg?.page ||
        currentArg?.sort !== previousArg?.sort ||
        currentArg?.query !== previousArg?.query
    })
  })
});
