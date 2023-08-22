"use client";

import { clsx } from "clsx";
import dynamic from "next/dynamic";
import React from "react";

import { dynamicLoader } from "~/common/dynamic";
import { TagListSkeleton, VirtualizedTagList } from "~/common/tag";
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
  setSelfFollowedTagCount,
  useGetFollowedTagsQuery
} from "~/redux/features";
import { useAppDispatch, useAppSelector } from "~/redux/hooks";
import { abbreviateNumber } from "~/utils/abbreviateNumber";

import DashboardTitle from "../../../dashboard-title";
import styles from "./styles.module.scss";
import { TagsProps } from "./tags.props";

const EmptyState = dynamic(() => import("./empty-state"), {
  loading: dynamicLoader()
});

type SortOrder = "dsc" | "asc";

export type TagsSortValue = "recent" | "old" | `popular-${SortOrder}`;

// Status header

const StatusHeader = ({
  followed_tag_count
}: TagsProps): React.ReactElement => {
  const dispatch = useAppDispatch();
  const followedTagCount =
    useAppSelector((state) => state.entities.selfFollowedTagCount) || 0;

  React.useEffect(() => {
    dispatch(setSelfFollowedTagCount(() => followed_tag_count));
  }, [dispatch, followed_tag_count]);

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
        {followedTagCount === 0 ? (
          "You have not followed any tags."
        ) : (
          <>
            You are following{" "}
            <span className={"t-bold"}>
              {abbreviateNumber(followedTagCount)}
            </span>{" "}
            {followedTagCount === 1 ? "tag" : "tags"}.
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
  onSortChange: (newSort: TagsSortValue) => void;
  query: string;
  sort: TagsSortValue;
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
      placeholder={"Search tags"}
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
      <Option value={"recent"}>Recent</Option>
      <Option value={"old"}>Old</Option>
      <Option value={"popular-dsc"}>Most popular</Option>
      <Option value={"popular-asc"}>Least popular</Option>
    </Select>
  </div>
);

const ContentTagsClient = (props: TagsProps): React.ReactElement => {
  const [sort, setSort] = React.useState<TagsSortValue>("recent");
  const [query, setQuery] = React.useState<string>("");
  const [page, setPage] = React.useState<number>(1);
  const debouncedQuery = useDebounce(query);
  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetFollowedTagsQuery({
      page,
      sort,
      query: debouncedQuery
    });
  const { items = [], hasMore } = data || {};
  const isTyping = query !== debouncedQuery;

  const loadMore = React.useCallback(
    () => setPage((prevState) => prevState + 1),
    []
  );

  const handleSortChange = React.useCallback(
    (newSort: TagsSortValue) => setSort(newSort),
    []
  );

  const handleQueryChange = React.useCallback(
    (newQuery: string) => setQuery(newQuery),
    []
  );

  return (
    <React.Fragment>
      <DashboardTitle>Followed tags</DashboardTitle>
      <StatusHeader {...props} />
      <ControlBar
        disabled={!items.length}
        onQueryChange={handleQueryChange}
        onSortChange={handleSortChange}
        query={query}
        sort={sort}
      />
      {isLoading || isTyping ? <TagListSkeleton /> : null}
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
        <EmptyState query={debouncedQuery} />
      ) : (
        <VirtualizedTagList
          hasMore={Boolean(hasMore)}
          loadMore={loadMore}
          tags={items}
        />
      )}
      <Spacer orientation={"vertical"} size={10} />
    </React.Fragment>
  );
};

export default ContentTagsClient;
