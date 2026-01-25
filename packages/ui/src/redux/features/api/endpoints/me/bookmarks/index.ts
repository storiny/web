import { Story } from "@storiny/types";

import { api_slice } from "~/redux/features/api/slice";
import { get_stories_with_query_and_sort } from "~/redux/features/api/utils/get-stories-with-query-and-sort";

const SEGMENT = "me/bookmarks";

export type GetBookmarksResponse = Story[];

export const {
  useLazyGetBookmarksQuery: use_get_bookmarks_query,
  endpoints: {
    getBookmarks: { select: select_bookmarks }
  }
} = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    getBookmarks: get_stories_with_query_and_sort(builder, SEGMENT)
  })
});
