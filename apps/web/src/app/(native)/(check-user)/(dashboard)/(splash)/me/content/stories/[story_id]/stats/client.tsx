"use client";

import { DeviceType } from "@storiny/shared";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import relative_time from "dayjs/plugin/relativeTime";
import dynamic from "next/dynamic";
import React from "react";

import { CommentListSkeleton, VirtualizedCommentList } from "~/common/comment";
import { dynamic_loader } from "~/common/dynamic";
import ProgressState from "~/common/progress-state";
import Divider from "~/components/divider";
import Main from "~/components/main";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import AreaChart from "~/entities/area-chart";
import ErrorState from "~/entities/error-state";
import Mercator from "~/entities/mercator";
import StatBars from "~/entities/stat-bars";
import StatBlock from "~/entities/stat-block";
import { use_default_fetch } from "~/hooks/use-default-fetch";
import HomeIcon from "~/icons/home";
import {
  get_query_error_type,
  use_get_story_comments_query,
  use_get_story_stats_query
} from "~/redux/features";
import css from "~/theme/main.module.scss";
import { capitalize } from "~/utils/capitalize";

import DashboardTitle from "../../../../../common/dashboard-title";
import DashboardWrapper from "../../../../../common/dashboard-wrapper";
import ContentStoryStatsRightSidebar from "./right-sidebar";
import { StoryStatsProps } from "./stats.props";
import styles from "./styles.module.scss";

dayjs.extend(relative_time);
dayjs.extend(duration);

const EmptyState = dynamic(
  () => import("../../../../../common/stats-empty-state"),
  {
    loading: dynamic_loader()
  }
);

const CommentList = ({
  story_id
}: {
  story_id: string;
}): React.ReactElement => {
  const [
    trigger,
    {
      data: { items = [] } = {},
      isLoading: is_loading,
      isFetching: is_fetching,
      isError: is_error,
      error
    }
  ] = use_get_story_comments_query();
  const refetch = use_default_fetch(
    trigger,
    {
      story_id,
      page: 1,
      sort: "most-liked",
      type: "all"
    },
    [story_id]
  );

  return is_loading || is_fetching ? (
    <CommentListSkeleton virtual />
  ) : is_error ? (
    <ErrorState
      auto_size
      component_props={{
        button: { loading: is_fetching }
      }}
      retry={refetch}
      type={get_query_error_type(error)}
    />
  ) : !is_fetching && !items.length ? (
    <EmptyState />
  ) : (
    <VirtualizedCommentList
      comment_props={{ is_static: true }}
      comments={items.slice(0, 5)}
      has_more={false}
      load_more={(): void => undefined}
      skeleton_props={{ virtual: true }}
    />
  );
};

const ContentStoryStatsClient = (
  props: StoryStatsProps
): React.ReactElement => {
  const { story_id } = props;
  const {
    data,
    isLoading: is_loading,
    isFetching: is_fetching,
    isError: is_error,
    error,
    refetch
  } = use_get_story_stats_query({
    id: story_id
  });

  return (
    <React.Fragment>
      <Main>
        <DashboardTitle
          back_button_href={"/me/content/stories"}
          hide_back_button={false}
        >
          Story statistics
        </DashboardTitle>
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
                  caption={"Did not go through your entire story."}
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
                  caption={"Read your story more than once."}
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
                <StatBlock
                  caption={((): string => {
                    const percent_change = Math.round(
                      100 -
                        (data.reading_time_estimate /
                          data.reading_time_average) *
                          100
                    );

                    return `${
                      percent_change >= 0 ? "+" : ""
                    }${percent_change}% of the estimated read time`;
                  })()}
                  caption_icon={
                    data.reading_time_average === data.reading_time_estimate
                      ? null
                      : data.reading_time_average > data.reading_time_estimate
                        ? "increment"
                        : "decrement"
                  }
                  className={styles.stat}
                  label={"Average reading time"}
                  value={capitalize(
                    dayjs
                      .duration(data.reading_time_average, "seconds")
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
              {/* Reading duration */}
              <div className={css["flex-col"]}>
                <Typography
                  as={"h2"}
                  color={"minor"}
                  level={"body2"}
                  weight={"medium"}
                >
                  Reading duration (last 3 months)
                </Typography>
                <Spacer orientation={"vertical"} size={3} />
                {data.reading_time_timeline.length ? (
                  <AreaChart
                    accessibility_label={"Story reading time chart"}
                    data={data.reading_time_timeline}
                    label={"Duration (in minutes)"}
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
              <Divider />
              <div className={styles.container}>
                <StatBlock
                  caption={"All time"}
                  className={styles.stat}
                  label={"Total likes"}
                  value={data.total_likes}
                />
                <StatBlock
                  caption={((): string => {
                    const percent_change = Math.round(
                      100 -
                        (data.likes_last_month / data.likes_this_month || 1) *
                          100
                    );

                    return `${
                      percent_change >= 0 ? "+" : ""
                    }${percent_change}% from last month`;
                  })()}
                  caption_icon={
                    data.likes_this_month === data.likes_last_month
                      ? null
                      : data.likes_this_month > data.likes_last_month
                        ? "increment"
                        : "decrement"
                  }
                  className={styles.stat}
                  label={"Likes this month"}
                  value={data.likes_this_month}
                />
              </div>
              {/* Story likes */}
              <div className={css["flex-col"]}>
                <Typography
                  as={"h2"}
                  color={"minor"}
                  level={"body2"}
                  weight={"medium"}
                >
                  Story likes (last 3 months)
                </Typography>
                <Spacer orientation={"vertical"} size={3} />
                {data.like_timeline.length ? (
                  <AreaChart
                    accessibility_label={"Story reads chart"}
                    data={data.like_timeline}
                    label={"Reads"}
                  />
                ) : (
                  <EmptyState />
                )}
              </div>
              <Divider />
              {/* Devices */}
              <div className={css["flex-col"]}>
                <Typography
                  as={"h2"}
                  color={"minor"}
                  level={"body2"}
                  weight={"medium"}
                >
                  Devices your readers use (last 3 months)
                </Typography>
                <Spacer orientation={"vertical"} size={0.5} />
                <Typography color={"minor"} level={"body3"}>
                  These are the devices that your audience uses to read your
                  stories.
                </Typography>
                <Spacer orientation={"vertical"} size={3} />
                {data.device_data.length ? (
                  <StatBars
                    data={data.device_data.map(([device_type, value]) => [
                      ((): string => {
                        switch (device_type) {
                          case DeviceType.COMPUTER:
                            return "Computer";
                          case DeviceType.TABLET:
                            return "Tablet";
                          case DeviceType.MOBILE:
                            return "Mobile";
                          default:
                            return "Unknown";
                        }
                      })(),
                      value
                    ])}
                    max_value={data.reads_last_three_months}
                  />
                ) : (
                  <EmptyState />
                )}
              </div>
              <Divider />
              {/* Comments */}
              <div className={styles.container}>
                <StatBlock
                  caption={"All time"}
                  className={styles.stat}
                  label={"Total comments"}
                  value={data.total_comments}
                />
                <StatBlock
                  caption={((): string => {
                    const percent_change = Math.round(
                      100 -
                        (data.comments_last_month / data.comments_this_month ||
                          1) *
                          100
                    );

                    return `${
                      percent_change >= 0 ? "+" : ""
                    }${percent_change}% from last month`;
                  })()}
                  caption_icon={
                    data.comments_this_month === data.comments_last_month
                      ? null
                      : data.comments_this_month > data.comments_last_month
                        ? "increment"
                        : "decrement"
                  }
                  className={styles.stat}
                  label={"Comments this month"}
                  value={data.comments_this_month}
                />
              </div>
              <div className={css["flex-col"]}>
                <Typography
                  as={"h2"}
                  color={"minor"}
                  level={"body2"}
                  weight={"medium"}
                >
                  Top comments
                </Typography>
                <Spacer orientation={"vertical"} size={0.5} />
                <Typography color={"minor"} level={"body3"}>
                  These are the comments that received the most attention on
                  this story.
                </Typography>
                <Spacer orientation={"vertical"} size={1.5} />
                <CommentList story_id={story_id} />
              </div>
            </>
          )}
        </DashboardWrapper>
        <Spacer orientation={"vertical"} size={10} />
      </Main>
      <ContentStoryStatsRightSidebar story_id={story_id} />
    </React.Fragment>
  );
};

export default ContentStoryStatsClient;
