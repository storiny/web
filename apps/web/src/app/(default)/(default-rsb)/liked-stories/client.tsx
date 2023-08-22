"use client";

import { clsx } from "clsx";
import dynamic from "next/dynamic";
import React from "react";

import { dynamicLoader } from "~/common/dynamic";
import { StoryListSkeleton, VirtualizedStoryList } from "~/common/story";
import Divider from "~/components/Divider";
import Input from "~/components/Input";
import Option from "~/components/Option";
import Select from "~/components/Select";
import ErrorState from "~/entities/ErrorState";
import PageTitle from "~/entities/PageTitle";
import { useDebounce } from "~/hooks/useDebounce";
import SearchIcon from "~/icons/Search";
import { getQueryErrorType, useGetLikedStoriesQuery } from "~/redux/features";

import styles from "./styles.module.scss";

const EmptyState = dynamic(() => import("./empty-state"), {
  loading: dynamicLoader()
});

export type LikedStoriesSortValue = "recent" | "old";

// Page header

const PageHeader = ({
  query,
  sort,
  onSortChange,
  onQueryChange,
  disabled
}: {
  disabled?: boolean;
  onQueryChange: (newQuery: string) => void;
  onSortChange: (newSort: LikedStoriesSortValue) => void;
  query: string;
  sort: LikedStoriesSortValue;
}): React.ReactElement => (
  <div
    className={clsx(
      "flex-center",
      "full-bleed",
      "page-header",
      "with-page-title"
    )}
  >
    <Input
      decorator={<SearchIcon />}
      disabled={disabled}
      onChange={(event): void => onQueryChange(event.target.value)}
      placeholder={"Search for liked stories"}
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
    </Select>
  </div>
);

const Client = (): React.ReactElement => {
  const [sort, setSort] = React.useState<LikedStoriesSortValue>("recent");
  const [query, setQuery] = React.useState<string>("");
  const [page, setPage] = React.useState<number>(1);
  const debouncedQuery = useDebounce(query);
  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetLikedStoriesQuery({
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
    (newSort: LikedStoriesSortValue) => setSort(newSort),
    []
  );

  const handleQueryChange = React.useCallback(
    (newQuery: string) => setQuery(newQuery),
    []
  );

  return (
    <>
      <PageTitle>Liked stories</PageTitle>
      <PageHeader
        disabled={!items.length}
        onQueryChange={handleQueryChange}
        onSortChange={handleSortChange}
        query={query}
        sort={sort}
      />
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
        <EmptyState query={query} />
      ) : isLoading || isTyping ? (
        <StoryListSkeleton />
      ) : (
        <VirtualizedStoryList
          hasMore={Boolean(hasMore)}
          loadMore={loadMore}
          stories={items}
          storyProps={{
            showUnlikeButton: true
          }}
        />
      )}
    </>
  );
};

export default Client;
