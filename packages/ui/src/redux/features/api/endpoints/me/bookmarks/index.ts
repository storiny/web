import { Story } from "@storiny/types";
import { get_stories_with_query_and_sort } from "src/redux/features/api/utils/get-stories-with-query-and-sort";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "me/bookmarks";

export type GetBookmarksResponse = Story[];

export const { useGetBookmarksQuery: use_get_bookmarks_query } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      getBookmarks: get_stories_with_query_and_sort(builder, SEGMENT)
    })
  });
