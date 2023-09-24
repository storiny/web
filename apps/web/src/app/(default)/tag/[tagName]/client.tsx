"use client";

import { clsx } from "clsx";
import dynamic from "next/dynamic";
import React from "react";

import { dynamicLoader } from "~/common/dynamic";
import { GetTagResponse } from "~/common/grpc";
import { StoryListSkeleton, VirtualizedStoryList } from "~/common/story";
import Divider from "~/components/Divider";
import Input from "~/components/Input";
import Option from "~/components/Option";
import Select from "~/components/Select";
import ErrorState from "~/entities/ErrorState";
import { useDebounce } from "~/hooks/useDebounce";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import SearchIcon from "~/icons/Search";
import { getQueryErrorType, useGetTagStoriesQuery } from "~/redux/features";
import { breakpoints } from "~/theme/breakpoints";

import styles from "./styles.module.scss";

const EmptyState = dynamic(() => import("./empty-state"), {
  loading: dynamicLoader()
});

const SuspendedContent = dynamic(() => import("./content"), {
  loading: dynamicLoader()
});

export type TagTabValue = "popular" | "recent";

interface Props {
  tag: GetTagResponse;
}

// Page header

const PageHeader = ({
  query,
  sort,
  tagName,
  onSortChange,
  onQueryChange,
  disabled
}: {
  disabled?: boolean;
  onQueryChange: (newQuery: string) => void;
  onSortChange: (newSort: TagTabValue) => void;
  query: string;
  sort: TagTabValue;
  tagName: string;
}): React.ReactElement => (
  <div
    className={clsx(
      "flex-center",
      "full-bleed",
      "page-header",
      styles.x,
      styles["page-header"]
    )}
  >
    <Input
      decorator={<SearchIcon />}
      disabled={disabled}
      onChange={(event): void => onQueryChange(event.target.value)}
      placeholder={`Search in #${tagName}`}
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
    </Select>
  </div>
);

const Page = ({ tag }: Props): React.ReactElement => {
  const isSmallerThanTablet = useMediaQuery(breakpoints.down("tablet"));
  const [sort, setSort] = React.useState<TagTabValue>("popular");
  const [query, setQuery] = React.useState<string>("");
  const [page, setPage] = React.useState<number>(1);
  const debouncedQuery = useDebounce(query);
  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetTagStoriesQuery({
      page,
      sort,
      tagName: tag.name,
      query: debouncedQuery
    });
  const { items = [], hasMore } = data || {};
  const isTyping = query !== debouncedQuery;

  const loadMore = React.useCallback(
    () => setPage((prevState) => prevState + 1),
    []
  );

  const handleQueryChange = React.useCallback((newQuery: string) => {
    setPage(1);
    setQuery(newQuery);
  }, []);

  const handleChange = React.useCallback((newValue: TagTabValue) => {
    setPage(1);
    setSort(newValue);
  }, []);

  return (
    <>
      {isSmallerThanTablet && <SuspendedContent tag={tag} />}
      <PageHeader
        disabled={!items.length}
        onQueryChange={handleQueryChange}
        onSortChange={handleChange}
        query={query}
        sort={sort}
        tagName={tag.name}
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
      ) : isLoading || isTyping || (isFetching && page === 1) ? (
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
