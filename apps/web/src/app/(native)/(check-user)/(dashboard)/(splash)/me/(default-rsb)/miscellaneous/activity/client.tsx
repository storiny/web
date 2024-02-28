"use client";

import { clsx } from "clsx";
import React from "react";

import {
  AccountActivityListSkeleton,
  VirtualizedAccountActivityList
} from "~/common/account-activity";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import ErrorState from "~/entities/error-state";
import {
  get_query_error_type,
  use_get_account_activity_query
} from "~/redux/features";
import css from "~/theme/main.module.scss";

import DashboardTitle from "../../../dashboard-title";
import styles from "./styles.module.scss";

// Status header

const StatusHeader = (): React.ReactElement => (
  <div
    className={clsx(
      css["full-bleed"],
      css["dashboard-header"],
      css["flex"],
      styles["status-header"]
    )}
  >
    <Typography level={"body2"}>
      Review the changes that you have made to your account since its creation.
    </Typography>
  </div>
);

const MiscellaneousActivityClient = (): React.ReactElement => {
  const [page, set_page] = React.useState<number>(1);
  const {
    data,
    isLoading: is_loading,
    isFetching: is_fetching,
    isError: is_error,
    error,
    refetch
  } = use_get_account_activity_query({
    page
  });
  const { items = [], has_more } = data || {};

  const load_more = React.useCallback(
    () => set_page((prev_state) => prev_state + 1),
    []
  );

  return (
    <React.Fragment>
      <DashboardTitle>Account activity</DashboardTitle>
      <StatusHeader />
      {is_loading || (is_fetching && page === 1) ? (
        <AccountActivityListSkeleton />
      ) : is_error ? (
        <ErrorState
          auto_size
          component_props={{
            button: { loading: is_fetching }
          }}
          retry={refetch}
          type={get_query_error_type(error)}
        />
      ) : (
        <VirtualizedAccountActivityList
          account_activities={items}
          has_more={Boolean(has_more)}
          load_more={load_more}
        />
      )}
      <Spacer orientation={"vertical"} size={10} />
    </React.Fragment>
  );
};

export default MiscellaneousActivityClient;
