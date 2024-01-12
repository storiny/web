import { use_get_account_stats_query } from "~/redux/features";

export type AccountMetricsRightSidebarProps = {
  hook_return: ReturnType<typeof use_get_account_stats_query>;
};
