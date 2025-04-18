"use client";

import { clsx } from "clsx";
import dynamic from "next/dynamic";
import React from "react";

import { dynamic_loader } from "~/common/dynamic";
import { UserListSkeleton, VirtualizedUserList } from "~/common/user";
import Main from "~/components/main";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import ErrorState from "~/entities/error-state";
import { use_default_fetch } from "~/hooks/use-default-fetch";
import { use_pagination } from "~/hooks/use-pagination";
import {
  get_query_error_type,
  select_blocked_users,
  self_action,
  use_get_blocked_users_query
} from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import css from "~/theme/main.module.scss";
import { abbreviate_number } from "~/utils/abbreviate-number";

import DashboardTitle from "../../../common/dashboard-title";
import { BlocksProps } from "./blocks.props";
import ModerationBlocksRightSidebar from "./right-sidebar";
import styles from "./styles.module.scss";

const EmptyState = dynamic(() => import("./empty-state"), {
  loading: dynamic_loader()
});

// Status header

const StatusHeader = ({
  block_count: block_count_prop
}: BlocksProps): React.ReactElement => {
  const dispatch = use_app_dispatch();
  const block_count =
    use_app_selector((state) => state.entities.self_block_count) || 0;

  React.useEffect(() => {
    dispatch(self_action("self_block_count", block_count_prop));
  }, [dispatch, block_count_prop]);

  return (
    <div
      className={clsx(
        css["full-bleed"],
        css["dashboard-header"],
        css["flex-center"],
        styles["status-header"]
      )}
      style={{ justifyContent: "flex-start" }}
    >
      <Typography ellipsis level={"body2"}>
        {block_count === 0 ? (
          "You have not blocked anyone yet."
        ) : (
          <>
            You have blocked{" "}
            <span className={css["t-bold"]}>
              {abbreviate_number(block_count)}
            </span>{" "}
            {block_count === 1 ? "user" : "users"}.
          </>
        )}
      </Typography>
    </div>
  );
};

const ModerationBlocksClient = (props: BlocksProps): React.ReactElement => {
  const page = use_pagination(select_blocked_users({ page: 1 }));
  const [
    trigger,
    {
      data: { items = [], has_more } = {},
      isLoading: is_loading,
      isFetching: is_fetching,
      isError: is_error,
      error
    }
  ] = use_get_blocked_users_query();
  const refetch = use_default_fetch(trigger, { page });

  const load_more = React.useCallback(() => {
    trigger({ page: page + 1 }, true);
  }, [page, trigger]);

  return (
    <React.Fragment>
      <Main>
        <DashboardTitle>Blocked users</DashboardTitle>
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
              action_type: "block"
            }}
            users={items}
          />
        )}
        <Spacer orientation={"vertical"} size={10} />
      </Main>
      <ModerationBlocksRightSidebar />
    </React.Fragment>
  );
};

export default ModerationBlocksClient;
