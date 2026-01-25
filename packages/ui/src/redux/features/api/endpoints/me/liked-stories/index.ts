import { Story } from "@storiny/types";

import { api_slice } from "~/redux/features/api/slice";
import { get_stories_with_query_and_sort } from "~/redux/features/api/utils/get-stories-with-query-and-sort";

const SEGMENT = "me/liked-stories";

export type GetLikedStoriesResponse = Story[];

export const {
  useLazyGetLikedStoriesQuery: use_get_liked_stories_query,
  endpoints: {
    getLikedStories: { select: select_liked_stories }
  }
} = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    getLikedStories: get_stories_with_query_and_sort(builder, SEGMENT)
  })
});
