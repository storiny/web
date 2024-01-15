import { DeviceType } from "@storiny/shared";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string => `me/stories/${id}/stats`;

export interface GetStoryStatsPayload {
  id: string;
}

export type GetStoryStatsResponse = {
  comments_last_month: number;
  comments_this_month: number;
  device_data: [DeviceType, number][];
  like_timeline: [string, number][];
  likes_last_month: number;
  likes_this_month: number;
  read_mercator: [string, number][];
  read_timeline: [string, number][];
  reading_time_average: number;
  reading_time_estimate: number;
  reading_time_last_month: number;
  reading_time_this_month: number;
  reading_time_timeline: [string, number][];
  reads_last_month: number;
  reads_last_three_months: number;
  reads_this_month: number;
  referral_data: [string, number][];
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
