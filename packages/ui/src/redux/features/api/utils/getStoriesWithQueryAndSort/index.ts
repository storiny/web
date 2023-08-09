import { EndpointBuilder } from "@reduxjs/toolkit/dist/query/endpointDefinitions";
import {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
  FetchBaseQueryMeta
} from "@reduxjs/toolkit/query";
import { Story } from "@storiny/types";

export type ApiQueryBuilder = EndpointBuilder<
  BaseQueryFn<
    string | FetchArgs,
    unknown,
    FetchBaseQueryError,
    {},
    FetchBaseQueryMeta
  >,
  "Notification" | "Asset", // Tags
  "api"
>;

const ITEMS_PER_PAGE = 10;

/**
 * Query builder for fetching stories with query and sort
 * parameters
 * @param builder Builder
 * @param segment Segment
 * @param defaultSort Default sort value
 */
export const getStoriesWithQueryAndSort = (
  builder: ApiQueryBuilder,
  segment: string,
  defaultSort: string = "recent"
): ReturnType<
  typeof builder.query<
    { hasMore: boolean; items: Story[] },
    { page: number; query?: string; sort: string }
  >
> =>
  builder.query<
    { hasMore: boolean; items: Story[] },
    { page: number; query?: string; sort: string }
  >({
    query: ({ page, sort = defaultSort, query }) =>
      `/${segment}?page=${page}&sort=${sort}${
        query ? `&query=${encodeURIComponent(query)}` : ""
      }`,
    serializeQueryArgs: ({ endpointName, queryArgs }) =>
      `${endpointName}:${queryArgs.sort}:${queryArgs.query}`,
    transformResponse: (response: Story[]) => ({
      items: response,
      hasMore: response.length === ITEMS_PER_PAGE
    }),
    merge: (currentCache, newItems) => {
      currentCache.items.push(
        ...newItems.items.filter(
          (item) =>
            !currentCache.items.some((cacheItem) => cacheItem.id === item.id)
        )
      );
    },
    forceRefetch: ({ currentArg, previousArg }) =>
      currentArg?.page !== previousArg?.page ||
      currentArg?.sort !== previousArg?.sort ||
      currentArg?.query !== previousArg?.query
  });
