import { use_get_stories_stats_query } from "~/redux/features";

export type StoriesMetricsRightSidebarProps = {
  hook_return: ReturnType<typeof use_get_stories_stats_query>;
};
