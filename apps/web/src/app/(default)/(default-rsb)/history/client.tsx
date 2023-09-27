"use client";

import { clsx } from "clsx";
import dynamic from "next/dynamic";
import NextLink from "next/link";
import React from "react";

import { dynamicLoader } from "~/common/dynamic";
import { StoryListSkeleton, VirtualizedStoryList } from "~/common/story";
import Divider from "~/components/Divider";
import IconButton from "~/components/IconButton";
import Input from "~/components/Input";
import ErrorState from "~/entities/ErrorState";
import PageTitle from "~/entities/PageTitle";
import { useDebounce } from "~/hooks/useDebounce";
import SearchIcon from "~/icons/Search";
import SettingsIcon from "~/icons/Settings";
import { get_query_error_type, use_get_history_query } from "~/redux/features";

import styles from "./styles.module.scss";

const EmptyState = dynamic(() => import("./empty-state"), {
  loading: dynamicLoader()
});

// Page header

const PageHeader = ({
  query,
  onQueryChange,
  disabled
}: {
  disabled?: boolean;
  onQueryChange: (newQuery: string) => void;
  query: string;
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
      placeholder={"Search your history"}
      size={"lg"}
      slot_props={{
        container: {
          className: clsx("f-grow", styles.x, styles.input)
        }
      }}
      type={"search"}
      value={query}
    />
    <Divider orientation={"vertical"} />
    <IconButton
      aria-label={"Modify history settings"}
      as={NextLink}
      checkAuth
      className={clsx("focus-invert", styles.x, styles["icon-button"])}
      href={"/me/privacy"}
      size={"lg"}
      title={"History settings"}
      variant={"ghost"}
    >
      <SettingsIcon />
    </IconButton>
  </div>
);

const Client = (): React.ReactElement => {
  const [query, setQuery] = React.useState<string>("");
  const [page, setPage] = React.useState<number>(1);
  const debouncedQuery = useDebounce(query);
  const { data, isLoading, isFetching, isError, error, refetch } =
    use_get_history_query({
      page,
      query: debouncedQuery
    });
  const { items = [], has_more } = data || {};
  const isTyping = query !== debouncedQuery;

  const loadMore = React.useCallback(
    () => setPage((prevState) => prevState + 1),
    []
  );

  const handleQueryChange = React.useCallback((newQuery: string) => {
    setPage(1);
    setQuery(newQuery);
  }, []);

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
          component_props={{
            button: { loading: isFetching }
          }}
          retry={refetch}
          type={get_query_error_type(error)}
        />
      ) : !isFetching && !items.length ? (
        <EmptyState query={query} />
      ) : isLoading || isTyping || (isFetching && page === 1) ? (
        <StoryListSkeleton />
      ) : (
        <VirtualizedStoryList
          has_more={Boolean(has_more)}
          loadMore={loadMore}
          stories={items}
        />
      )}
    </>
  );
};

export default Client;
