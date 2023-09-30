import { Story } from "@storiny/types";

import { api_slice } from "~/redux/features/api/slice";
import { get_stories_with_query_and_sort } from "~/redux/features/api/utils/get-stories-with-query-and-sort";

const SEGMENT = "me/liked-stories";

export type GetLikedStoriesResponse = Story[];

export const { useGetLikedStoriesQuery: use_get_liked_stories_query } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      getLikedStories: get_stories_with_query_and_sort(builder, SEGMENT)
    })
  });
