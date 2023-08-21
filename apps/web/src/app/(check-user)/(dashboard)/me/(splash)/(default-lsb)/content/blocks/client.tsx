"use client";

import { clsx } from "clsx";
import dynamic from "next/dynamic";
import React from "react";

import SuspenseLoader from "~/common/suspense-loader";
import { UserListSkeleton, VirtualizedUserList } from "~/common/user";
import Divider from "~/components/Divider";
import Input from "~/components/Input";
import Option from "~/components/Option";
import Select from "~/components/Select";
import Spacer from "~/components/Spacer";
import Typography from "~/components/Typography";
import ErrorState from "~/entities/ErrorState";
import { useDebounce } from "~/hooks/useDebounce";
import SearchIcon from "~/icons/Search";
import {
  getQueryErrorType,
  setSelfBlockCount,
  useGetRelationsQuery
} from "~/redux/features";
import { useAppDispatch, useAppSelector } from "~/redux/hooks";
import { abbreviateNumber } from "~/utils/abbreviateNumber";

import DashboardTitle from "../../dashboard-title";
import { BlocksProps } from "./blocks.props";
import ContentRelationsRightSidebar from "./right-sidebar";
import styles from "./styles.module.scss";

const EmptyState = dynamic(() => import("./empty-state"), {
  loading: () => <SuspenseLoader />
});

export type BlocksSortValue = "recent" | "old";

// Status header

const StatusHeader = ({ block_count }: BlocksProps): React.ReactElement => {
  const dispatch = useAppDispatch();
  const blockCount = useAppSelector((state) => state.entities.selfBlockCount);

  React.useEffect(() => {
    dispatch(setSelfBlockCount(() => block_count));
  }, [dispatch, block_count]);

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
        {blockCount === 0 ? (
          "You have not blocked anyone yet."
        ) : (
          <>
            You have blocked{" "}
            <span className={"t-bold"}>{abbreviateNumber(blockCount)}</span>{" "}
            {blockCount === 1 ? "user" : "users"}.
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
  onSortChange,
  onQueryChange,
  disabled
}: {
  disabled?: boolean;
  onQueryChange: (newQuery: string) => void;
  onSortChange: (newSort: BlocksSortValue) => void;
  query: string;
  sort: BlocksSortValue;
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
      placeholder={"Search your blocked users"}
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

  const handleSortChange = React.useCallback(
    (newSort: RelationsSortValue) => setSort(newSort),
    []
  );

  const handleQueryChange = React.useCallback(
    (newQuery: string) => setQuery(newQuery),
    []
  );

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
        {isLoading || isTyping ? <UserListSkeleton /> : null}
        {isError ? (
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
