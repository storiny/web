"use client";

import { clsx } from "clsx";
import dynamic from "next/dynamic";
import React from "react";

import { dynamic_loader } from "~/common/dynamic";
import { StoryListSkeleton, VirtualizedStoryList } from "~/common/story";
import Divider from "~/components/divider";
import Input from "~/components/input";
import Option from "~/components/option";
import Select from "~/components/select";
import ErrorState from "~/entities/error-state";
import { use_debounce } from "~/hooks/use-debounce";
import { use_default_fetch } from "~/hooks/use-default-fetch";
import { use_handle_dynamic_state } from "~/hooks/use-handle-dynamic-state";
import { use_pagination } from "~/hooks/use-pagination";
import SearchIcon from "~/icons/search";
import {
  get_query_error_type,
  select_bookmarks,
  use_get_bookmarks_query
} from "~/redux/features";
import css from "~/theme/main.module.scss";

const EmptyState = dynamic(() => import("./empty-state"), {
  loading: dynamic_loader()
});

export type BookmarksSortValue = "recent" | "old";

// Page header

const PageHeader = ({
  query,
  sort,
  on_sort_change,
  on_query_change,
  disabled
}: {
  disabled?: boolean;
  on_query_change: (next_query: string) => void;
  on_sort_change: (next_sort: BookmarksSortValue) => void;
  query: string;
  sort: BookmarksSortValue;
}): React.ReactElement => (
  <div
    className={clsx(css["flex-center"], css["full-bleed"], css["page-header"])}
  >
    <Input
      decorator={<SearchIcon />}
      disabled={disabled}
      onChange={(event): void => on_query_change(event.target.value)}
      placeholder={"Search for bookmarked stories"}
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
      <Option value={"recent"}>Recent</Option>
      <Option value={"old"}>Old</Option>
    </Select>
  </div>
);

const Client = (): React.ReactElement => {
  const [sort, set_sort] = React.useState<BookmarksSortValue>("recent");
  const [query, set_query] = React.useState<string>("");
  use_handle_dynamic_state<typeof query>("", set_query);
  use_handle_dynamic_state<typeof sort>("recent", set_sort);
  const debounced_query = use_debounce(query);
  const page = use_pagination(
    select_bookmarks({
      page: 1,
      sort,
      query: debounced_query
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
  ] = use_get_bookmarks_query();
  const refetch = use_default_fetch(
    trigger,
    {
      page,
      sort,
      query: debounced_query
    },
    [debounced_query, sort]
  );
  const is_typing = query !== debounced_query;

  const load_more = React.useCallback(() => {
    trigger(
      {
        page: page + 1,
        sort,
        query: debounced_query
      },
      true
    );
  }, [debounced_query, page, sort, trigger]);

  const handle_sort_change = React.useCallback(
    (next_sort: BookmarksSortValue) => {
      set_sort(next_sort);
    },
    []
  );

  const handle_query_change = React.useCallback((next_query: string) => {
    set_query(next_query);
  }, []);

  return (
    <>
      <PageHeader
        disabled={!query && !items.length}
        on_query_change={handle_query_change}
        on_sort_change={handle_sort_change}
        query={query}
        sort={sort}
      />
      {is_error ? (
        <ErrorState
          auto_size
          component_props={{
            button: { loading: is_fetching }
          }}
          retry={refetch}
          type={get_query_error_type(error)}
        />
      ) : !is_fetching && !items.length ? (
        <EmptyState query={query} />
      ) : is_loading || is_typing || (is_fetching && page === 1) ? (
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
