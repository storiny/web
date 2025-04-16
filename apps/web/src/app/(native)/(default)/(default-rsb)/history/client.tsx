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
import { use_default_fetch } from "~/hooks/use-default-fetch";
import { use_handle_dynamic_state } from "~/hooks/use-handle-dynamic-state";
import { use_pagination } from "~/hooks/use-pagination";
import SearchIcon from "~/icons/search";
import SettingsIcon from "~/icons/settings";
import {
  get_query_error_type,
  select_history,
  use_get_history_query
} from "~/redux/features";
import css from "~/theme/main.module.scss";

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
      css["flex-center"],
      css["full-bleed"],
      css["page-header"],
      css["with-page-title"]
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
      className={clsx(css["focus-invert"], styles.x, styles["icon-button"])}
      href={"/me/account/privacy"}
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
  use_handle_dynamic_state<typeof query>("", set_query);
  const debounced_query = use_debounce(query);
  const page = use_pagination(
    select_history({
      page: 1,
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
  ] = use_get_history_query();
  const refetch = use_default_fetch(
    trigger,
    {
      page,
      query: debounced_query
    },
    [debounced_query]
  );
  const is_typing = query !== debounced_query;

  const load_more = React.useCallback(() => {
    trigger(
      {
        page: page + 1,
        query: debounced_query
      },
      true
    );
  }, [debounced_query, page, trigger]);

  const handle_query_change = React.useCallback((next_query: string) => {
    set_query(next_query);
  }, []);

  return (
    <>
      <PageTitle>History</PageTitle>
      <PageHeader
        disabled={!query && !items.length}
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
