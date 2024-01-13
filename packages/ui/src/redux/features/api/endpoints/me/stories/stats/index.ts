import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string => `me/stories/${id}/stats`;

export interface GetStoryStatsPayload {
  id: string;
}

export type GetStoryStatsResponse = {
  comments_last_month: number;
  comments_this_month: number;
  device_map: Record<string, number>;
  like_timeline: Record<string, number>;
  likes_last_month: number;
  likes_this_month: number;
  read_mercator: Record<string, number>;
  read_timeline: Record<string, number>;
  reading_time_average: number;
  reading_time_estimate: number;
  reading_time_last_month: number;
  reading_time_this_month: number;
  reading_time_timeline: Record<string, number>;
  reads_last_month: number;
  reads_last_three_months: number;
  reads_this_month: number;
  referral_map: Record<string, number>;
  returning_readers: number;
  total_comments: number;
  total_likes: number;
  total_reads: number;
  total_views: number;
};

export const { useGetStoryStatsQuery: use_get_story_stats_query } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      getStoryStats: builder.query<GetStoryStatsResponse, GetStoryStatsPayload>(
        {
          query: ({ id }) => `/${SEGMENT(id)}`,
          serializeQueryArgs: ({ endpointName }) => endpointName
        }
      )
    })
  });
