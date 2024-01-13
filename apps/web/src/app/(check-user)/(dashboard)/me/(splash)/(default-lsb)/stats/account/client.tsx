"use client";

import dynamic from "next/dynamic";
import React from "react";

import { dynamic_loader } from "~/common/dynamic";
import ProgressState from "~/common/progress-state";
import Divider from "~/components/divider";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import AreaChart from "~/entities/area-chart";
import ErrorState from "~/entities/error-state";
import StatBlock from "~/entities/stat-block";
import {
  get_query_error_type,
  use_get_account_stats_query
} from "~/redux/features";
import css from "~/theme/main.module.scss";

import DashboardTitle from "../../dashboard-title";
import DashboardWrapper from "../../dashboard-wrapper";
import AccountMetricsRightSidebar from "./right-sidebar";
import styles from "./styles.module.scss";

const EmptyState = dynamic(() => import("../../stats-empty-state"), {
  loading: dynamic_loader()
});

const AccountMetricsClient = (): React.ReactElement => {
  const hook_return = use_get_account_stats_query();
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
        <DashboardTitle>Account statistics</DashboardTitle>
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
                  caption={"All time"}
                  className={styles.stat}
                  label={"Total followers"}
                  value={data.total_followers}
                />
                <StatBlock
                  caption={`${Math.round(
                    (data.total_subscribers / data.total_followers) * 100
                  )}% of your followers`}
                  className={styles.stat}
                  label={"Subscribers"}
                  value={data.total_subscribers}
                />
                <StatBlock
                  caption={((): string => {
                    const percent_change = Math.round(
                      100 -
                        (data.follows_last_month / data.follows_this_month) *
                          100
                    );

                    return `${
                      percent_change >= 0 ? "+" : ""
                    }${percent_change}% from last month`;
                  })()}
                  caption_icon={
                    data.follows_this_month === data.follows_last_month
                      ? null
                      : data.follows_this_month > data.follows_last_month
                        ? "increment"
                        : "decrement"
                  }
                  className={styles.stat}
                  label={"Follows this month"}
                  value={data.follows_this_month}
                />
              </div>
              <Divider />
              <div className={css["flex-col"]}>
                <Typography
                  as={"h2"}
                  className={css["t-medium"]}
                  color={"minor"}
                  level={"body2"}
                >
                  Account follows (last 3 months)
                </Typography>
                <Spacer orientation={"vertical"} size={3} />
                {Object.keys(data.follow_timeline).length ? (
                  <AreaChart
                    accessibility_label={"Account follows chart"}
                    data={Object.entries(data.follow_timeline).map(
                      ([key, value]) => ({
                        value,
                        date: key
                      })
                    )}
                    label={"Follows"}
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
      <AccountMetricsRightSidebar hook_return={hook_return} />
    </React.Fragment>
  );
};

export default AccountMetricsClient;
