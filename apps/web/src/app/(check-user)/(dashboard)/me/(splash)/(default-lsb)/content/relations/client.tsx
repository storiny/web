"use client";

import { clsx } from "clsx";
import dynamic from "next/dynamic";
import React from "react";

import { dynamic_loader } from "~/common/dynamic";
import { UserListSkeleton, VirtualizedUserList } from "~/common/user";
import Divider from "../../../../../../../../../../../packages/ui/src/components/divider";
import Input from "../../../../../../../../../../../packages/ui/src/components/input";
import Option from "../../../../../../../../../../../packages/ui/src/components/option";
import Select from "../../../../../../../../../../../packages/ui/src/components/select";
import Spacer from "../../../../../../../../../../../packages/ui/src/components/spacer";
import Tab from "../../../../../../../../../../../packages/ui/src/components/tab";
import Tabs from "../../../../../../../../../../../packages/ui/src/components/tabs";
import TabsList from "../../../../../../../../../../../packages/ui/src/components/tabs-list";
import Typography from "../../../../../../../../../../../packages/ui/src/components/typography";
import ErrorState from "../../../../../../../../../../../packages/ui/src/entities/error-state";
import { use_debounce } from "../../../../../../../../../../../packages/ui/src/hooks/use-debounce";
import { use_media_query } from "../../../../../../../../../../../packages/ui/src/hooks/use-media-query";
import SearchIcon from "../../../../../../../../../../../packages/ui/src/icons/search";
import {
  get_query_error_type,
  select_user,
  set_self_follower_count,
  set_self_following_count,
  set_self_friend_count,
  use_get_relations_query
} from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import { BREAKPOINTS } from "~/theme/breakpoints";
import { abbreviate_number } from "../../../../../../../../../../../packages/ui/src/utils/abbreviate-number";

import DashboardTitle from "../../dashboard-title";
import { RelationsProps } from "./relations.props";
import ContentRelationsRightSidebar from "./right-sidebar";
import styles from "./styles.module.scss";

const EmptyState = dynamic(() => import("./empty-state"), {
  loading: dynamic_loader()
});
const FriendRequests = dynamic(() => import("./right-sidebar/friend-requests"));

export type RelationsTabValue = "followers" | "following" | "friends";
export type RelationsSortValue = "popular" | "recent" | "old";

// Page header tabs

const PageHeader = ({
  value,
  on_change
}: {
  on_change: (next_value: RelationsTabValue) => void;
  value: RelationsTabValue;
}): React.ReactElement => (
  <Tabs
    className={clsx(
      "full-bleed",
      "page-header",
      "dashboard-header",
      "with-page-title",
      styles.x,
      styles.tabs
    )}
    onValueChange={(next_value: RelationsTabValue): void =>
      on_change(next_value)
    }
    value={value}
  >
    <TabsList className={clsx("full-w", styles.x, styles["tabs-list"])}>
      <Tab aria-controls={undefined} value={"followers"}>
        Followers
      </Tab>
      <Tab aria-controls={undefined} value={"following"}>
        Following
      </Tab>
      <Tab aria-controls={undefined} value={"friends"}>
        Friends
      </Tab>
    </TabsList>
  </Tabs>
);

// Status header

const StatusHeader = ({
  tab,
  follower_count,
  friend_count,
  following_count
}: {
  tab: RelationsTabValue;
} & Omit<
  RelationsProps,
  "pending_friend_request_count"
>): React.ReactElement => {
  const is_smaller_than_desktop = use_media_query(BREAKPOINTS.down("desktop"));
  const dispatch = use_app_dispatch();
  const user = use_app_selector(select_user)!;
  const count_param =
    (tab === "followers"
      ? user.follower_count
      : tab === "following"
      ? user.following_count
      : user.friend_count) || 0;

  React.useEffect(() => {
    [
      set_self_following_count(following_count),
      set_self_follower_count(follower_count),
      set_self_friend_count(friend_count)
    ].forEach(dispatch);
  }, [dispatch, follower_count, following_count, friend_count]);

  return (
    <div
      className={clsx(
        "full-bleed",
        "dashboard-header",
        "flex-center",
        styles["status-header"]
      )}
    >
      <Typography ellipsis level={"body2"}>
        {count_param === 0 ? (
          tab === "followers" ? (
            "You do not have any followers."
          ) : tab === "following" ? (
            "You do not follow anyone yet."
          ) : (
            "You do not have any friends yet."
          )
        ) : tab === "following" ? (
          <>
            You are following{" "}
            <span className={"t-bold"}>{abbreviate_number(count_param)}</span>{" "}
            people.
          </>
        ) : (
          <>
            You have{" "}
            <span className={"t-bold"}>{abbreviate_number(count_param)}</span>{" "}
            {count_param === 1
              ? tab === "followers"
                ? "follower"
                : tab === "friends"
                ? "friend"
                : tab
              : tab}
            .
          </>
        )}
      </Typography>
      {is_smaller_than_desktop && tab === "friends" ? <FriendRequests /> : null}
    </div>
  );
};

// Control bar

const ControlBar = ({
  tab,
  query,
  sort,
  on_sort_change,
  on_query_change,
  disabled
}: {
  disabled?: boolean;
  on_query_change: (next_query: string) => void;
  on_sort_change: (next_sort: RelationsSortValue) => void;
  query: string;
  sort: RelationsSortValue;
  tab: RelationsTabValue;
}): React.ReactElement => (
  <div
    className={clsx(
      "flex-center",
      "full-bleed",
      "dashboard-header",
      styles["control-bar"]
    )}
  >
    <Input
      decorator={<SearchIcon />}
      disabled={disabled}
      onChange={(event): void => on_query_change(event.target.value)}
      placeholder={
        tab === "following" ? "Search users you follow" : `Search your ${tab}`
      }
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
      <Option value={"popular"}>Popular</Option>
      <Option value={"recent"}>Recent</Option>
      <Option value={"old"}>Old</Option>
    </Select>
  </div>
);

const ContentRelationsClient = (props: RelationsProps): React.ReactElement => {
  const { pending_friend_request_count } = props;
  const [sort, set_sort] = React.useState<RelationsSortValue>("popular");
  const [query, set_query] = React.useState<string>("");
  const [value, set_value] = React.useState<RelationsTabValue>("followers");
  const [page, set_page] = React.useState<number>(1);
  const debounced_query = use_debounce(query);
  const {
    data,
    isLoading: is_loading,
    isFetching: is_fetching,
    isError: is_error,
    error,
    refetch
  } = use_get_relations_query({
    page,
    sort,
    query: debounced_query,
    relation_type: value
  });
  const { items = [], has_more } = data || {};
  const is_typing = query !== debounced_query;

  const load_more = React.useCallback(
    () => set_page((prev_state) => prev_state + 1),
    []
  );

  const handle_change = React.useCallback((next_value: RelationsTabValue) => {
    set_page(1);
    set_sort("popular");
    set_query("");
    set_value(next_value);
  }, []);

  const handle_sort_change = React.useCallback(
    (next_sort: RelationsSortValue) => {
      set_page(1);
      set_sort(next_sort);
    },
    []
  );

  const handle_query_change = React.useCallback((next_query: string) => {
    set_page(1);
    set_query(next_query);
  }, []);

  return (
    <React.Fragment>
      <main>
        <DashboardTitle>Relations</DashboardTitle>
        <PageHeader on_change={handle_change} value={value} />
        <StatusHeader {...props} tab={value} />
        <ControlBar
          disabled={!items.length}
          on_query_change={handle_query_change}
          on_sort_change={handle_sort_change}
          query={query}
          sort={sort}
          tab={value}
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
          <EmptyState query={query} value={value} />
        ) : (
          <VirtualizedUserList
            has_more={Boolean(has_more)}
            load_more={load_more}
            users={items}
          />
        )}
        <Spacer orientation={"vertical"} size={10} />
      </main>
      <ContentRelationsRightSidebar
        pending_friend_request_count={pending_friend_request_count}
        tab={value}
      />
    </React.Fragment>
  );
};

export default ContentRelationsClient;
