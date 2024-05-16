import { use_get_blog_stories_stats_query } from "~/redux/features";

export type StoriesStatsRightSidebarProps = {
  hook_return: ReturnType<typeof use_get_blog_stories_stats_query>;
};
