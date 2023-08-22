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
  getQueryErrorType,
  useGetAccountActivityQuery
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
    useGetAccountActivityQuery({
      page
    });
  const { items = [], hasMore } = data || {};

  const loadMore = React.useCallback(
    () => setPage((prevState) => prevState + 1),
    []
  );

  return (
    <React.Fragment>
      <DashboardTitle>Account activity</DashboardTitle>
      <StatusHeader />
      {isLoading ? <AccountActivityListSkeleton /> : null}
      {isError ? (
        <ErrorState
          autoSize
          componentProps={{
            button: { loading: isFetching }
          }}
          retry={refetch}
          type={getQueryErrorType(error)}
        />
      ) : (
        <VirtualizedAccountActivityList
          accountActivities={items}
          hasMore={Boolean(hasMore)}
          loadMore={loadMore}
        />
      )}
      <Spacer orientation={"vertical"} size={10} />
    </React.Fragment>
  );
};

export default MiscellaneousActivityClient;
