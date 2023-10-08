"use client";

import { clsx } from "clsx";
import dynamic from "next/dynamic";
import React from "react";

import { dynamic_loader } from "~/common/dynamic";
import { UserListSkeleton, VirtualizedUserList } from "~/common/user";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import ErrorState from "~/entities/error-state";
import {
  get_query_error_type,
  self_action,
  use_get_muted_users_query
} from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import css from "~/theme/main.module.scss";
import { abbreviate_number } from "~/utils/abbreviate-number";

import DashboardTitle from "../../dashboard-title";
import { MutesProps } from "./mutes.props";
import ModerationMutesRightSidebar from "./right-sidebar";
import styles from "./styles.module.scss";

const EmptyState = dynamic(() => import("./empty-state"), {
  loading: dynamic_loader()
});

// Status header

const StatusHeader = ({
  mute_count: mute_count_prop
}: MutesProps): React.ReactElement => {
  const dispatch = use_app_dispatch();
  const mute_count =
    use_app_selector((state) => state.entities.self_mute_count) || 0;

  React.useEffect(() => {
    dispatch(self_action("self_mute_count", mute_count_prop));
  }, [dispatch, mute_count_prop]);

  return (
    <div
      className={clsx(
        css["full-bleed"],
        css["dashboard-header"],
        css["flex-center"],
        styles["status-header"]
      )}
    >
      <Typography ellipsis level={"body2"}>
        {mute_count === 0 ? (
          "You have not muted anyone yet."
        ) : (
          <>
            You have muted{" "}
            <span className={css["t-bold"]}>
              {abbreviate_number(mute_count)}
            </span>{" "}
            {mute_count === 1 ? "user" : "users"}.
          </>
        )}
      </Typography>
    </div>
  );
};

const ModerationMutesClient = (props: MutesProps): React.ReactElement => {
  const [page, set_page] = React.useState<number>(1);
  const {
    data,
    isLoading: is_loading,
    isFetching: is_fetching,
    isError: is_error,
    error,
    refetch
  } = use_get_muted_users_query({
    page
  });
  const { items = [], has_more } = data || {};

  const load_more = React.useCallback(
    () => set_page((prev_state) => prev_state + 1),
    []
  );

  return (
    <React.Fragment>
      <main data-root={"true"}>
        <DashboardTitle>Muted users</DashboardTitle>
        <StatusHeader {...props} />
        {is_loading || (is_fetching && page === 1) ? (
          <UserListSkeleton />
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
          <VirtualizedUserList
            has_more={Boolean(has_more)}
            load_more={load_more}
            user_props={{
              action_type: "mute"
            }}
            users={items}
          />
        )}
        <Spacer orientation={"vertical"} size={10} />
      </main>
      <ModerationMutesRightSidebar />
    </React.Fragment>
  );
};

export default ModerationMutesClient;
