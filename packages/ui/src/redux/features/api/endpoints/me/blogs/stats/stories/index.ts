import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string => `me/blogs/${id}/stats/stories`;

export type GetBlogStoriesStatsRequest = { blog_id: string };

export type GetBlogStoriesStatsResponse = {
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

export const { useGetBlogStoriesStatsQuery: use_get_blog_stories_stats_query } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      getBlogStoriesStats: builder.query<
        GetBlogStoriesStatsResponse,
        GetBlogStoriesStatsRequest
      >({
        query: ({ blog_id }) => ({
          url: `/${SEGMENT(blog_id)}`,
          headers: { "x-storiny-blog-id": blog_id }
        }),
        serializeQueryArgs: ({ endpointName }) => endpointName
      })
    })
  });
