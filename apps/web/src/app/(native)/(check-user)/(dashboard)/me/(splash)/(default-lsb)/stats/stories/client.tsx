"use client";

import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import relative_time from "dayjs/plugin/relativeTime";
import dynamic from "next/dynamic";
import React from "react";

import { dynamic_loader } from "~/common/dynamic";
import ProgressState from "~/common/progress-state";
import Divider from "~/components/divider";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import AreaChart from "~/entities/area-chart";
import ErrorState from "~/entities/error-state";
import Mercator from "~/entities/mercator";
import StatBars from "~/entities/stat-bars";
import StatBlock from "~/entities/stat-block";
import HomeIcon from "~/icons/home";
import {
  get_query_error_type,
  select_user,
  use_get_stories_stats_query
} from "~/redux/features";
import { use_app_selector } from "~/redux/hooks";
import css from "~/theme/main.module.scss";
import { capitalize } from "~/utils/capitalize";

import DashboardTitle from "../../dashboard-title";
import DashboardWrapper from "../../dashboard-wrapper";
import StoriesStatsRightSidebar from "./right-sidebar";
import styles from "./styles.module.scss";

dayjs.extend(relative_time);
dayjs.extend(duration);

const EmptyState = dynamic(() => import("../../stats-empty-state"), {
  loading: dynamic_loader()
});

const StoriesStatsClient = (): React.ReactElement => {
  const user = use_app_selector(select_user);
  const hook_return = use_get_stories_stats_query({ user_id: user?.id || "" });
  const {
    data,
    isLoading: is_loading,
    isFetching: is_fetching,
    isError: is_error,
    error,
    refetch
  } = hook_return;

  return (
    <React.Fragment>
      <main data-root={"true"}>
        <DashboardTitle>Stories statistics</DashboardTitle>
        <DashboardWrapper>
          {is_error ? (
            <ErrorState
              auto_size
              component_props={{
                button: { loading: is_fetching }
              }}
              retry={refetch}
              type={get_query_error_type(error)}
            />
          ) : !data || is_loading || is_fetching ? (
            <ProgressState label={"Loading statistics data…"} />
          ) : (
            <>
              <div className={styles.container}>
                <StatBlock
                  caption={"Did not go through your entire stories."}
                  className={styles.stat}
                  label={"Total visitors"}
                  value={data.total_views}
                />
                <StatBlock
                  caption={"All time"}
                  className={styles.stat}
                  label={"Total reads"}
                  value={data.total_reads}
                />
                <StatBlock
                  caption={"Read your stories more than once."}
                  className={styles.stat}
                  label={"Returning readers"}
                  value={data.returning_readers}
                />
                <StatBlock
                  caption={((): string => {
                    const percent_change = Math.round(
                      100 -
                        (data.reads_last_month / data.reads_this_month || 1) *
                          100
                    );

                    return `${
                      percent_change >= 0 ? "+" : ""
                    }${percent_change}% from last month`;
                  })()}
                  caption_icon={
                    data.reads_this_month === data.reads_last_month
                      ? null
                      : data.reads_this_month > data.reads_last_month
                        ? "increment"
                        : "decrement"
                  }
                  className={styles.stat}
                  label={"Reads this month"}
                  value={data.reads_this_month}
                />
                <StatBlock
                  caption={((): string => {
                    const percent_change = Math.round(
                      100 -
                        (data.reading_time_last_month /
                          data.reading_time_this_month || 1) *
                          100
                    );

                    return `${
                      percent_change >= 0 ? "+" : ""
                    }${percent_change}% from last month`;
                  })()}
                  caption_icon={
                    data.reading_time_this_month ===
                    data.reading_time_last_month
                      ? null
                      : data.reading_time_this_month >
                          data.reading_time_last_month
                        ? "increment"
                        : "decrement"
                  }
                  className={styles.stat}
                  label={"Reading time this month"}
                  value={capitalize(
                    dayjs
                      .duration(data.reading_time_this_month, "seconds")
                      .humanize()
                  )}
                />
              </div>
              {/* Story reads */}
              <div className={css["flex-col"]}>
                <Typography
                  as={"h2"}
                  color={"minor"}
                  level={"body2"}
                  weight={"medium"}
                >
                  Story reads (last 3 months)
                </Typography>
                <Spacer orientation={"vertical"} size={3} />
                {data.read_timeline.length ? (
                  <AreaChart
                    accessibility_label={"Story reads chart"}
                    data={data.read_timeline}
                    label={"Reads"}
                  />
                ) : (
                  <EmptyState />
                )}
              </div>
              <Divider />
              {/* Readers by country */}
              <div className={css["flex-col"]}>
                <Typography
                  as={"h2"}
                  color={"minor"}
                  level={"body2"}
                  weight={"medium"}
                >
                  Readers by country (last 3 months)
                </Typography>
                <Spacer orientation={"vertical"} size={0.5} />
                <Typography color={"minor"} level={"body3"}>
                  Countries with less than 15 readers are not displayed due to
                  privacy reasons.
                </Typography>
                <Spacer orientation={"vertical"} size={3} />
                {data.read_mercator.length ? (
                  <div className={styles.mercator}>
                    <Mercator
                      accessibility_label={"Readers by country chart"}
                      data={data.read_mercator}
                      label={{
                        plural: "readers",
                        singular: "reader"
                      }}
                    />
                  </div>
                ) : (
                  <EmptyState />
                )}
              </div>
              <Divider />
              {/* Referral sources */}
              <div className={css["flex-col"]}>
                <Typography
                  as={"h2"}
                  color={"minor"}
                  level={"body2"}
                  weight={"medium"}
                >
                  Referral sources (last 3 months)
                </Typography>
                <Spacer orientation={"vertical"} size={0.5} />
                <Typography color={"minor"} level={"body3"}>
                  These are the top referral sources for your readers.
                </Typography>
                <Spacer orientation={"vertical"} size={3} />
                {data.referral_data.length ? (
                  <StatBars
                    data={data.referral_data}
                    icon_map={{ Internal: <HomeIcon /> }}
                    max_value={data.reads_last_three_months}
                  />
                ) : (
                  <EmptyState />
                )}
              </div>
            </>
          )}
        </DashboardWrapper>
        <Spacer orientation={"vertical"} size={10} />
      </main>
      <StoriesStatsRightSidebar hook_return={hook_return} />
    </React.Fragment>
  );
};

export default StoriesStatsClient;
