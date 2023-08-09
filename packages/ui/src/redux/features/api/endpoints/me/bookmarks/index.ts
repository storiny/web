import { Story } from "@storiny/types";

import { apiSlice } from "~/redux/features/api/slice";
import { getStoriesWithQueryAndSort } from "~/redux/features/api/utils/getStoriesWithQueryAndSort";

const SEGMENT = "me/bookmarks";

export type GetBookmarksResponse = Story[];

export const { useGetBookmarksQuery } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getBookmarks: getStoriesWithQueryAndSort(builder, SEGMENT)
  })
});
