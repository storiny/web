import { Story } from "@storiny/types";

import { ApiQueryBuilder } from "~/redux/features/api/types";

import { getStoriesWithQueryAndSort } from "../../stories-with-query-and-sort";

const SEGMENT = "me/liked-stories";

export type GetLikedStoriesResponse = Story[];

export const getLikedStories = (
  builder: ApiQueryBuilder
): ReturnType<typeof getStoriesWithQueryAndSort> =>
  getStoriesWithQueryAndSort(builder, SEGMENT);
