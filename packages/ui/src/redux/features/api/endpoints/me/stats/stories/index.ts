import { Story } from "@storiny/types";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "me/stats/stories";

export type GetStoriesStatsResponse = {
  latest_story: Story | null;
  read_mercator: Record<string, number>;
  read_timeline: Record<string, number>;
  reading_time_last_month: number;
  reading_time_this_month: number;
  reads_last_month: number;
  reads_last_three_months: number;
  reads_this_month: number;
  referral_map: Record<string, number>;
  returning_readers: number;
  total_reads: number;
  total_views: number;
};

export const { useGetStoriesStatsQuery: use_get_stories_stats_query } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      getStoriesStats: builder.query<GetStoriesStatsResponse, void>({
        query: () => `/${SEGMENT}`,
        serializeQueryArgs: ({ endpointName }) => endpointName
      })
    })
  });
