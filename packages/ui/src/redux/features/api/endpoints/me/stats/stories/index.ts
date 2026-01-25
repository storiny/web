import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "me/stats/stories";

export type GetStoriesStatsRequest = { user_id: string };

export type GetStoriesStatsResponse = {
  latest_story_id: string | null;
  read_mercator: [string, number][];
  read_timeline: [string, number][];
  reading_time_last_month: number;
  reading_time_this_month: number;
  reads_last_month: number;
  reads_last_three_months: number;
  reads_this_month: number;
  referral_data: [string, number][];
  returning_readers: number;
  total_reads: number;
  total_views: number;
};

export const { useGetStoriesStatsQuery: use_get_stories_stats_query } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      getStoriesStats: builder.query<
        GetStoriesStatsResponse,
        GetStoriesStatsRequest
      >({
        query: ({ user_id }) => ({
          url: `/${SEGMENT}`,
          headers: { "x-storiny-uid": user_id }
        }),
        serializeQueryArgs: ({ endpointName }) => endpointName
      })
    })
  });
