import { Tag } from "@storiny/types";
import { TagsSortValue } from "@storiny/web/src/app/(native)/(check-user)/(dashboard)/(splash)/me/(default-rsb)/content/tags/client";

import { merge_fn } from "~/redux/features";
import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "me/followed-tags";
const ITEMS_PER_PAGE = 10;

export type GetFollowedTagsResponse = Tag[];

export const {
  useLazyGetFollowedTagsQuery: use_get_followed_tags_query,
  endpoints: {
    getFollowedTags: { select: select_followed_tags }
  }
} = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    getFollowedTags: builder.query<
      { has_more: boolean; items: Tag[]; page: number },
      { page: number; query?: string; sort: TagsSortValue }
    >({
      query: ({ page, sort, query }) =>
        `/${SEGMENT}?page=${page}&sort=${sort}${
          query ? `&query=${encodeURIComponent(query)}` : ""
        }`,
      serializeQueryArgs: ({ endpointName, queryArgs }) =>
        `${endpointName}:${queryArgs.sort}:${queryArgs.query}`,
      transformResponse: (response: Tag[], _, { page }) => ({
        page,
        items: response,
        has_more: response.length === ITEMS_PER_PAGE
      }),
      merge: (cache, data) => merge_fn(cache, data),
      forceRefetch: ({ currentArg, previousArg }) =>
        currentArg?.page !== previousArg?.page ||
        currentArg?.sort !== previousArg?.sort ||
        currentArg?.query !== previousArg?.query
    })
  })
});
