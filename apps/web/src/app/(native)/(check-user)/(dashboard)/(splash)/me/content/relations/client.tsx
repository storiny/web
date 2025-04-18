"use client";

import { clsx } from "clsx";
import dynamic from "next/dynamic";
import {
  usePathname as use_pathname,
  useSearchParams as use_search_params
} from "next/navigation";
import React from "react";

import { dynamic_loader } from "~/common/dynamic";
import { UserListSkeleton, VirtualizedUserList } from "~/common/user";
import { use_app_router } from "~/common/utils";
import Divider from "~/components/divider";
import Input from "~/components/input";
import Main from "~/components/main";
import Option from "~/components/option";
import Select from "~/components/select";
import Spacer from "~/components/spacer";
import Tab from "~/components/tab";
import Tabs from "~/components/tabs";
import TabsList from "~/components/tabs-list";
import Typography from "~/components/typography";
import ErrorState from "~/entities/error-state";
import { use_debounce } from "~/hooks/use-debounce";
import { use_default_fetch } from "~/hooks/use-default-fetch";
import { use_handle_dynamic_state } from "~/hooks/use-handle-dynamic-state";
import { use_media_query } from "~/hooks/use-media-query";
import { use_pagination } from "~/hooks/use-pagination";
import SearchIcon from "~/icons/search";
import {
  get_query_error_type,
  select_relations,
  select_user,
  set_self_follower_count,
  set_self_following_count,
  set_self_friend_count,
  use_get_relations_query
} from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import { BREAKPOINTS } from "~/theme/breakpoints";
import css from "~/theme/main.module.scss";
import { abbreviate_number } from "~/utils/abbreviate-number";

import DashboardTitle from "../../../common/dashboard-title";
import { RelationsProps } from "./relations.props";
import ContentRelationsRightSidebar from "./right-sidebar";
import FriendRequests from "./right-sidebar/friend-requests";
import styles from "./styles.module.scss";

const EmptyState = dynamic(() => import("./empty-state"), {
  loading: dynamic_loader()
});

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
      css["full-bleed"],
      css["page-header"],
      css["dashboard-header"],
      css["with-page-title"],
      styles.x,
      styles.tabs
    )}
    onValueChange={(next_value): void =>
      on_change(next_value as RelationsTabValue)
    }
    value={value}
  >
    <TabsList className={clsx(css["full-w"], styles.x, styles["tabs-list"])}>
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
        css["full-bleed"],
        css["dashboard-header"],
        css["flex-center"],
        styles["status-header"]
      )}
      style={{ justifyContent: "flex-start" }}
    >
      <Typography ellipsis level={"body2"} style={{ width: "100%" }}>
        {count_param === 0 ? (
          tab === "followers" ? (
            "You do not have any followers yet."
          ) : tab === "following" ? (
            "You do not follow anyone yet."
          ) : (
            "You do not have any friends yet."
          )
        ) : tab === "following" ? (
          <>
            You are following{" "}
            <span className={css["t-bold"]}>
              {abbreviate_number(count_param)}
            </span>{" "}
            {count_param === 1 ? "person" : "people"}.
          </>
        ) : (
          <>
            You have{" "}
            <span className={css["t-bold"]}>
              {abbreviate_number(count_param)}
            </span>{" "}
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
  const router = use_app_router();
  const pathname = use_pathname();
  const search_params = use_search_params();
  const tab = search_params.get("tab") || "followers";
  const [sort, set_sort] = React.useState<RelationsSortValue>("popular");
  const [query, set_query] = React.useState<string>("");
  const [value, set_value] = React.useState<RelationsTabValue>(
    (["followers", "following", "friends"] as RelationsTabValue[]).includes(
      tab as RelationsTabValue
    )
      ? (tab as RelationsTabValue)
      : "followers"
  );
  use_handle_dynamic_state<typeof sort>("popular", set_sort);
  use_handle_dynamic_state<typeof query>("", set_query);
  const debounced_query = use_debounce(query);
  const page = use_pagination(
    select_relations({
      page: 1,
      sort,
      query: debounced_query,
      relation_type: value
    })
  );
  const [
    trigger,
    {
      data: { items = [], has_more } = {},
      isLoading: is_loading,
      isFetching: is_fetching,
      isError: is_error,
      error
    }
  ] = use_get_relations_query();
  const refetch = use_default_fetch(
    trigger,
    {
      page,
      sort,
      query: debounced_query,
      relation_type: value
    },
    [debounced_query, sort, value]
  );
  const is_typing = query !== debounced_query;

  const load_more = React.useCallback(() => {
    trigger(
      {
        page: page + 1,
        sort,
        query: debounced_query,
        relation_type: value
      },
      true
    );
  }, [debounced_query, page, sort, trigger, value]);

  const handle_change = React.useCallback((next_value: RelationsTabValue) => {
    set_sort("popular");
    set_query("");
    set_value(next_value);
  }, []);

  const handle_sort_change = React.useCallback(
    (next_sort: RelationsSortValue) => {
      set_sort(next_sort);
    },
    []
  );

  const handle_query_change = React.useCallback((next_query: string) => {
    set_query(next_query);
  }, []);

  React.useEffect(() => {
    if (value === "followers") {
      router.push(pathname);
    } else {
      router.push(`${pathname}?tab=${value}`);
    }
  }, [pathname, router, value]);

  return (
    <React.Fragment>
      <Main>
        <DashboardTitle>Relations</DashboardTitle>
        <PageHeader on_change={handle_change} value={value} />
        <StatusHeader {...props} tab={value} />
        <ControlBar
          disabled={!query && !items.length}
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
      </Main>
      <ContentRelationsRightSidebar
        pending_friend_request_count={pending_friend_request_count}
        tab={value}
      />
    </React.Fragment>
  );
};

export default ContentRelationsClient;
