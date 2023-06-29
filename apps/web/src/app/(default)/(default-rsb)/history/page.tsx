"use client";

import { clsx } from "clsx";
import dynamic from "next/dynamic";
import NextLink from "next/link";
import React from "react";

import { StoryListSkeleton, VirtualizedStoryList } from "~/common/story";
import SuspenseLoader from "~/common/suspense-loader";
import Divider from "~/components/Divider";
import IconButton from "~/components/IconButton";
import Input from "~/components/Input";
import ErrorState from "~/entities/ErrorState";
import PageTitle from "~/entities/PageTitle";
import { useDebounce } from "~/hooks/useDebounce";
import SearchIcon from "~/icons/Search";
import SettingsIcon from "~/icons/Settings";
import { getQueryErrorType, useGetHistoryQuery } from "~/redux/features";

import styles from "./styles.module.scss";

const EmptyState = dynamic(() => import("./empty-state"), {
  loading: () => <SuspenseLoader />,
});

// Page header

const PageHeader = ({
  query,
  onQueryChange,
  disabled,
}: {
  disabled?: boolean;
  onQueryChange: (newQuery: string) => void;
  query: string;
}): React.ReactElement => (
  <div className={clsx("flex-center", "page-header", "with-page-title")}>
    <Input
      decorator={<SearchIcon />}
      disabled={disabled}
      onChange={(event): void => onQueryChange(event.target.value)}
      placeholder={"Search your history"}
      size={"lg"}
      slotProps={{
        container: {
          className: clsx("f-grow", styles.input),
        },
      }}
      type={"search"}
      value={query}
    />
    <Divider orientation={"vertical"} />
    <IconButton
      aria-label={"Modify history settings"}
      as={NextLink}
      checkAuth
      className={styles["icon-button"]}
      href={"/me/privacy"}
      size={"lg"}
      title={"History settings"}
      variant={"ghost"}
    >
      <SettingsIcon />
    </IconButton>
  </div>
);

const Page = (): React.ReactElement => {
  const [query, setQuery] = React.useState<string>("");
  const [page, setPage] = React.useState<number>(1);
  const debouncedQuery = useDebounce(query);
  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetHistoryQuery({
      page,
      query: debouncedQuery,
    });
  const { items = [], hasMore } = data || {};
  const isTyping = query !== debouncedQuery;

  const loadMore = React.useCallback(
    () => setPage((prevState) => prevState + 1),
    []
  );

  const handleQueryChange = React.useCallback(
    (newQuery: string) => setQuery(newQuery),
    []
  );

  return (
    <>
      <PageTitle>History</PageTitle>
      <PageHeader
        disabled={!items.length}
        onQueryChange={handleQueryChange}
        query={query}
      />
      {isError ? (
        <ErrorState
          autoSize
          componentProps={{
            button: { loading: isFetching },
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
        />
      )}
    </>
  );
};

export default Page;
