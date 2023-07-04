import { Story } from "@storiny/types";

import { ApiQueryBuilder } from "~/redux/features/api/types";

import { getStoriesWithQueryAndSort } from "../../stories-with-query-and-sort";

const SEGMENT = "me/bookmarks";

export type GetBookmarksResponse = Story[];

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const getBookmarks = (builder: ApiQueryBuilder) =>
  getStoriesWithQueryAndSort(builder, SEGMENT);
