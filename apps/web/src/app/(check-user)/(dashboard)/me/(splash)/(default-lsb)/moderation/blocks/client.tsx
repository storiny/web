"use client";

import { clsx } from "clsx";
import dynamic from "next/dynamic";
import React from "react";

import { dynamic_loader } from "~/common/dynamic";
import { UserListSkeleton, VirtualizedUserList } from "~/common/user";
import Divider from "~/components/divider";
import Input from "~/components/input";
import Option from "~/components/option";
import Select from "~/components/select";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import ErrorState from "~/entities/error-state";
import { use_debounce } from "~/hooks/use-debounce";
import SearchIcon from "~/icons/search";
import {
  get_query_error_type,
  self_action,
  use_get_blocked_users_query
} from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import css from "~/theme/main.module.scss";
import { abbreviate_number } from "~/utils/abbreviate-number";

import DashboardTitle from "../../dashboard-title";
import { BlocksProps } from "./blocks.props";
import ModerationBlocksRightSidebar from "./right-sidebar";
import styles from "./styles.module.scss";

const EmptyState = dynamic(() => import("./empty-state"), {
  loading: dynamic_loader()
});

export type BlocksSortValue = "recent" | "old";

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

// Control bar

const ControlBar = ({
  query,
  sort,
  on_sort_change,
  on_query_change,
  disabled
}: {
  disabled?: boolean;
  on_query_change: (next_query: string) => void;
  on_sort_change: (next_sort: BlocksSortValue) => void;
  query: string;
  sort: BlocksSortValue;
}): React.ReactElement => (
  <div
    className={clsx(
      css["flex-center"],
      css["full-bleed"],
      css["dashboard-header"],
      styles["control-bar"]
    )}
  >
    <Input
      decorator={<SearchIcon />}
      disabled={disabled}
      onChange={(event): void => on_query_change(event.target.value)}
      placeholder={"Search your blocked users"}
      size={"lg"}
      type={"search"}
      value={query}
    />
    <Divider orientation={"vertical"} />
    <Select
      disabled={disabled}
      onValueChange={on_sort_change}
      slot_props={{
        trigger: {
          "aria-label": "Sort items"
        },
        value: {
          placeholder: "Sort"
        }
      }}
      value={sort}
    >
      <Option value={"recent"}>Recent</Option>
      <Option value={"old"}>Old</Option>
    </Select>
  </div>
);

const ModerationBlocksClient = (props: BlocksProps): React.ReactElement => {
  const [sort, set_sort] = React.useState<BlocksSortValue>("recent");
  const [query, set_query] = React.useState<string>("");
  const [page, set_page] = React.useState<number>(1);
  const debounced_query = use_debounce(query);
  const {
    data,
    isLoading: is_loading,
    isFetching: is_fetching,
    isError: is_error,
    error,
    refetch
  } = use_get_blocked_users_query({
    page,
    sort,
    query: debounced_query
  });
  const { items = [], has_more } = data || {};
  const is_typing = query !== debounced_query;

  const load_more = React.useCallback(
    () => set_page((prev_state) => prev_state + 1),
    []
  );

  const handle_sort_change = React.useCallback((next_sort: BlocksSortValue) => {
    set_page(1);
    set_sort(next_sort);
  }, []);

  const handle_query_change = React.useCallback((next_query: string) => {
    set_page(1);
    set_query(next_query);
  }, []);

  return (
    <React.Fragment>
      <main data-root={"true"}>
        <DashboardTitle>Blocked users</DashboardTitle>
        <StatusHeader {...props} />
        <ControlBar
          disabled={!items.length}
          on_query_change={handle_query_change}
          on_sort_change={handle_sort_change}
          query={query}
          sort={sort}
        />
        {is_loading || is_typing || (is_fetching && page === 1) ? (
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
          <EmptyState query={query} />
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
      </main>
      <ModerationBlocksRightSidebar />
    </React.Fragment>
  );
};

export default ModerationBlocksClient;
