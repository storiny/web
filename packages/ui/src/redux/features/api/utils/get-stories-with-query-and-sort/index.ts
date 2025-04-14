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
    object,
    FetchBaseQueryMeta
  >,
  // Tags
  | "Notification"
  | "Asset"
  | "Story"
  | "Comment"
  | "Reply"
  | "Blog"
  | "BlogRequest"
  | "FriendRequest"
  | "CollaborationRequest"
  | "BlogEditorRequest"
  | "BlogWriterRequest",
  "api"
>;

const ITEMS_PER_PAGE = 10;

/**
 * Query builder for fetching stories with query and sort
 * parameters
 * @param builder Builder
 * @param segment Segment
 * @param default_sort Default sort value
 */
export const get_stories_with_query_and_sort = (
  builder: ApiQueryBuilder,
  segment: string,
  default_sort = "recent"
): ReturnType<
  typeof builder.query<
    { has_more: boolean; items: Story[] },
    { page: number; query?: string; sort: string }
  >
> =>
  builder.query<
    { has_more: boolean; items: Story[] },
    { page: number; query?: string; sort: string }
  >({
    query: ({ page, sort = default_sort, query }) =>
      `/${segment}?page=${page}&sort=${sort}${
        query ? `&query=${encodeURIComponent(query)}` : ""
      }`,
    serializeQueryArgs: ({ endpointName, queryArgs }) =>
      `${endpointName}:${queryArgs.sort}:${queryArgs.query}`,
    transformResponse: (response: Story[]) => ({
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
  });
