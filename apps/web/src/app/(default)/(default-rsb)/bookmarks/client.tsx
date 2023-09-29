"use client";

import { clsx } from "clsx";
import dynamic from "next/dynamic";
import React from "react";

import { dynamicLoader } from "~/common/dynamic";
import { StoryListSkeleton, VirtualizedStoryList } from "~/common/story";
import Divider from "../../../../../../../packages/ui/src/components/divider";
import Input from "../../../../../../../packages/ui/src/components/input";
import Option from "../../../../../../../packages/ui/src/components/option";
import Select from "../../../../../../../packages/ui/src/components/select";
import ErrorState from "../../../../../../../packages/ui/src/entities/error-state";
import { use_debounce } from "../../../../../../../packages/ui/src/hooks/use-debounce";
import SearchIcon from "~/icons/Search";
import {
  get_query_error_type,
  use_get_bookmarks_query
} from "~/redux/features";

import styles from "./styles.module.scss";

const EmptyState = dynamic(() => import("./empty-state"), {
  loading: dynamicLoader()
});

export type BookmarksSortValue = "recent" | "old";

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
  onSortChange: (newSort: BookmarksSortValue) => void;
  query: string;
  sort: BookmarksSortValue;
}): React.ReactElement => (
  <div className={clsx("flex-center", "full-bleed", "page-header")}>
    <Input
      decorator={<SearchIcon />}
      disabled={disabled}
      onChange={(event): void => onQueryChange(event.target.value)}
      placeholder={"Search for bookmarked stories"}
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
    <Select
      disabled={disabled}
      onValueChange={onSortChange}
      slot_props={{
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
  const [sort, setSort] = React.useState<BookmarksSortValue>("recent");
  const [query, setQuery] = React.useState<string>("");
  const [page, set_page] = React.useState<number>(1);
  const debounced_query = use_debounce(query);
  const { data, isLoading, isFetching, isError, error, refetch } =
    use_get_bookmarks_query({
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

  const handleSortChange = React.useCallback((newSort: BookmarksSortValue) => {
    set_page(1);
    setSort(newSort);
  }, []);

  const handleQueryChange = React.useCallback((newQuery: string) => {
    set_page(1);
    setQuery(newQuery);
  }, []);

  return (
    <>
      <PageHeader
        disabled={!items.length}
        onQueryChange={handleQueryChange}
        onSortChange={handleSortChange}
        query={query}
        sort={sort}
      />
      {isError ? (
        <ErrorState
          auto_size
          component_props={{
            button: { loading: isFetching }
          }}
          retry={refetch}
          type={get_query_error_type(error)}
        />
      ) : !isFetching && !items.length ? (
        <EmptyState query={query} />
      ) : isLoading || is_typing || (isFetching && page === 1) ? (
        <StoryListSkeleton />
      ) : (
        <VirtualizedStoryList
          has_more={Boolean(has_more)}
          load_more={load_more}
          stories={items}
        />
      )}
    </>
  );
};

export default Client;
