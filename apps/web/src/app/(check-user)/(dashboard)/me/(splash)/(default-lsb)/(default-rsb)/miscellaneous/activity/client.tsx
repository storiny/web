"use client";

import { clsx } from "clsx";
import React from "react";

import {
  AccountActivityListSkeleton,
  VirtualizedAccountActivityList
} from "~/common/account-activity";
import Spacer from "~/components/Spacer";
import Typography from "~/components/Typography";
import ErrorState from "~/entities/ErrorState";
import {
  get_query_error_type,
  use_get_account_activity_query
} from "~/redux/features";

import DashboardTitle from "../../../dashboard-title";
import styles from "./styles.module.scss";

// Status header

const StatusHeader = (): React.ReactElement => (
  <div
    className={clsx(
      "full-bleed",
      "dashboard-header",
      "flex",
      styles.x,
      styles["status-header"]
    )}
  >
    <Typography level={"body2"}>
      Review the changes that you have made to your account since its creation.
    </Typography>
  </div>
);

const MiscellaneousActivityClient = (): React.ReactElement => {
  const [page, setPage] = React.useState<number>(1);
  const { data, isLoading, isFetching, isError, error, refetch } =
    use_get_account_activity_query({
      page
    });
  const { items = [], has_more } = data || {};

  const loadMore = React.useCallback(
    () => setPage((prevState) => prevState + 1),
    []
  );

  return (
    <React.Fragment>
      <DashboardTitle>Account activity</DashboardTitle>
      <StatusHeader />
      {isLoading || (isFetching && page === 1) ? (
        <AccountActivityListSkeleton />
      ) : isError ? (
        <ErrorState
          autoSize
          component_props={{
            button: { loading: isFetching }
          }}
          retry={refetch}
          type={get_query_error_type(error)}
        />
      ) : (
        <VirtualizedAccountActivityList
          accountActivities={items}
          has_more={Boolean(has_more)}
          loadMore={loadMore}
        />
      )}
      <Spacer orientation={"vertical"} size={10} />
    </React.Fragment>
  );
};

export default MiscellaneousActivityClient;
