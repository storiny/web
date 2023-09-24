"use client";

import { clsx } from "clsx";
import dynamic from "next/dynamic";
import React from "react";

import { dynamicLoader } from "~/common/dynamic";
import { UserListSkeleton, VirtualizedUserList } from "~/common/user";
import Divider from "~/components/Divider";
import Input from "~/components/Input";
import Option from "~/components/Option";
import Select from "~/components/Select";
import Spacer from "~/components/Spacer";
import Tab from "~/components/Tab";
import Tabs from "~/components/Tabs";
import TabsList from "~/components/TabsList";
import Typography from "~/components/Typography";
import ErrorState from "~/entities/ErrorState";
import { useDebounce } from "~/hooks/useDebounce";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import SearchIcon from "~/icons/Search";
import {
  getQueryErrorType,
  selectUser,
  setSelfFollowerCount,
  setSelfFollowingCount,
  setSelfFriendCount,
  useGetRelationsQuery
} from "~/redux/features";
import { useAppDispatch, useAppSelector } from "~/redux/hooks";
import { breakpoints } from "~/theme/breakpoints";
import { abbreviateNumber } from "~/utils/abbreviateNumber";

import DashboardTitle from "../../dashboard-title";
import { RelationsProps } from "./relations.props";
import ContentRelationsRightSidebar from "./right-sidebar";
import styles from "./styles.module.scss";

const EmptyState = dynamic(() => import("./empty-state"), {
  loading: dynamicLoader()
});

const FriendRequests = dynamic(() => import("./right-sidebar/friend-requests"));

export type RelationsTabValue = "followers" | "following" | "friends";
export type RelationsSortValue = "popular" | "recent" | "old";

// Page header tabs

const PageHeader = ({
  value,
  onChange
}: {
  onChange: (newValue: RelationsTabValue) => void;
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
    onValueChange={(newValue): void => onChange(newValue as RelationsTabValue)}
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
  const isSmallerThanDesktop = useMediaQuery(breakpoints.down("desktop"));
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser)!;
  const count_param =
    (tab === "followers"
      ? user.follower_count
      : tab === "following"
      ? user.following_count
      : user.friend_count) || 0;

  React.useEffect(() => {
    dispatch(setSelfFollowingCount(() => following_count));
    dispatch(setSelfFollowerCount(() => follower_count));
    dispatch(setSelfFriendCount(() => friend_count));
  }, [dispatch, follower_count, following_count, friend_count]);

  return (
    <div
      className={clsx(
        "full-bleed",
        "dashboard-header",
        "flex-center",
        styles.x,
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
            <span className={"t-bold"}>{abbreviateNumber(count_param)}</span>{" "}
            people.
          </>
        ) : (
          <>
            You have{" "}
            <span className={"t-bold"}>{abbreviateNumber(count_param)}</span>{" "}
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
      {isSmallerThanDesktop && tab === "friends" ? <FriendRequests /> : null}
    </div>
  );
};

// Control bar

const ControlBar = ({
  tab,
  query,
  sort,
  onSortChange,
  onQueryChange,
  disabled
}: {
  disabled?: boolean;
  onQueryChange: (newQuery: string) => void;
  onSortChange: (newSort: RelationsSortValue) => void;
  query: string;
  sort: RelationsSortValue;
  tab: RelationsTabValue;
}): React.ReactElement => (
  <div
    className={clsx(
      "flex-center",
      "full-bleed",
      "dashboard-header",
      styles.x,
      styles["control-bar"]
    )}
  >
    <Input
      decorator={<SearchIcon />}
      disabled={disabled}
      onChange={(event): void => onQueryChange(event.target.value)}
      placeholder={
        tab === "following" ? "Search users you follow" : `Search your ${tab}`
      }
      size={"lg"}
      slotProps={{
        container: {
          className: clsx("f-grow", styles.x, styles.input)
        }
      }}
      type={"search"}
      value={query}
    />
    <Divider orientation={"vertical"} />
    <Select
      disabled={disabled}
      onValueChange={onSortChange}
      slotProps={{
        trigger: {
          "aria-label": "Sort items",
          className: clsx("focus-invert", styles.x, styles["select-trigger"])
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
  const [sort, setSort] = React.useState<RelationsSortValue>("popular");
  const [query, setQuery] = React.useState<string>("");
  const [value, setValue] = React.useState<RelationsTabValue>("followers");
  const [page, setPage] = React.useState<number>(1);
  const debouncedQuery = useDebounce(query);
  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetRelationsQuery({
      page,
      sort,
      query: debouncedQuery,
      relationType: value
    });
  const { items = [], hasMore } = data || {};
  const isTyping = query !== debouncedQuery;

  const loadMore = React.useCallback(
    () => setPage((prevState) => prevState + 1),
    []
  );

  const handleChange = React.useCallback((newValue: RelationsTabValue) => {
    setPage(1);
    setSort("popular");
    setQuery("");
    setValue(newValue);
  }, []);

  const handleSortChange = React.useCallback((newSort: RelationsSortValue) => {
    setPage(1);
    setSort(newSort);
  }, []);

  const handleQueryChange = React.useCallback((newQuery: string) => {
    setPage(1);
    setQuery(newQuery);
  }, []);

  React.useEffect(() => {
    setSort(1);
  }, [value]);

  return (
    <React.Fragment>
      <main>
        <DashboardTitle>Relations</DashboardTitle>
        <PageHeader onChange={handleChange} value={value} />
        <StatusHeader {...props} tab={value} />
        <ControlBar
          disabled={!items.length}
          onQueryChange={handleQueryChange}
          onSortChange={handleSortChange}
          query={query}
          sort={sort}
          tab={value}
        />
        {isLoading || isTyping || (isFetching && page === 1) ? (
          <UserListSkeleton />
        ) : isError ? (
          <ErrorState
            autoSize
            componentProps={{
              button: { loading: isFetching }
            }}
            retry={refetch}
            type={getQueryErrorType(error)}
          />
        ) : !isFetching && !items.length ? (
          <EmptyState query={query} value={value} />
        ) : (
          <VirtualizedUserList
            hasMore={Boolean(hasMore)}
            loadMore={loadMore}
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
