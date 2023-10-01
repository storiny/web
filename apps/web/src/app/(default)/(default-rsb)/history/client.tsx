"use client";

import { clsx } from "clsx";
import dynamic from "next/dynamic";
import NextLink from "next/link";
import React from "react";

import { dynamic_loader } from "~/common/dynamic";
import { StoryListSkeleton, VirtualizedStoryList } from "~/common/story";
import Divider from "~/components/divider";
import IconButton from "~/components/icon-button";
import Input from "~/components/input";
import ErrorState from "~/entities/error-state";
import PageTitle from "~/entities/page-title";
import { use_debounce } from "~/hooks/use-debounce";
import SearchIcon from "~/icons/search";
import SettingsIcon from "~/icons/settings";
import { get_query_error_type, use_get_history_query } from "~/redux/features";

import styles from "./styles.module.scss";

const EmptyState = dynamic(() => import("./empty-state"), {
  loading: dynamic_loader()
});

// Page header

const PageHeader = ({
  query,
  on_query_change,
  disabled
}: {
  disabled?: boolean;
  on_query_change: (next_query: string) => void;
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
      onChange={(event): void => on_query_change(event.target.value)}
      placeholder={"Search your history"}
      size={"lg"}
      type={"search"}
      value={query}
    />
    <Divider orientation={"vertical"} />
    <IconButton
      aria-label={"Modify history settings"}
      as={NextLink}
      check_auth
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
  const [query, set_query] = React.useState<string>("");
  const [page, set_page] = React.useState<number>(1);
  const debounced_query = use_debounce(query);
  const {
    data,
    isLoading: is_loading,
    isFetching: is_fetching,
    isError: is_error,
    error,
    refetch
  } = use_get_history_query({
    page,
    query: debounced_query
  });
  const { items = [], has_more } = data || {};
  const is_typing = query !== debounced_query;

  const load_more = React.useCallback(
    () => set_page((prev_state) => prev_state + 1),
    []
  );

  const handle_query_change = React.useCallback((next_query: string) => {
    set_page(1);
    set_query(next_query);
  }, []);

  return (
    <>
      <PageTitle>History</PageTitle>
      <PageHeader
        disabled={!items.length}
        on_query_change={handle_query_change}
        query={query}
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
