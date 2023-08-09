import { Story } from "@storiny/types";

import { apiSlice } from "~/redux/features/api/slice";
import { getStoriesWithQueryAndSort } from "~/redux/features/api/utils/getStoriesWithQueryAndSort";

const SEGMENT = "me/liked-stories";

export type GetLikedStoriesResponse = Story[];

export const { useGetLikedStoriesQuery } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getLikedStories: getStoriesWithQueryAndSort(builder, SEGMENT)
  })
});
