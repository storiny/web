"use client";

import { clsx } from "clsx";
import dynamic from "next/dynamic";
import NextLink from "next/link";
import React from "react";

import { dynamicLoader } from "~/common/dynamic";
import { StoryListSkeleton, VirtualizedStoryList } from "~/common/story";
import Divider from "../../../../../../../packages/ui/src/components/divider";
import IconButton from "../../../../../../../packages/ui/src/components/icon-button";
import Input from "../../../../../../../packages/ui/src/components/input";
import ErrorState from "../../../../../../../packages/ui/src/entities/error-state";
import PageTitle from "../../../../../../../packages/ui/src/entities/page-title";
import { use_debounce } from "../../../../../../../packages/ui/src/hooks/use-debounce";
import SearchIcon from "../../../../../../../packages/ui/src/icons/search";
import SettingsIcon from "../../../../../../../packages/ui/src/icons/settings";
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
  const [query, setQuery] = React.useState<string>("");
  const [page, set_page] = React.useState<number>(1);
  const debounced_query = use_debounce(query);
  const { data, isLoading, is_fetching, isError, error, refetch } =
    use_get_history_query({
      page,
      query: debounced_query
    });
  const { items = [], has_more } = data || {};
  const is_typing = query !== debounced_query;

  const load_more = React.useCallback(
    () => set_page((prev_state) => prev_state + 1),
    []
  );

  const handleQueryChange = React.useCallback((newQuery: string) => {
    set_page(1);
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
          auto_size
          component_props={{
            button: { loading: is_fetching }
          }}
          retry={refetch}
          type={get_query_error_type(error)}
        />
      ) : !is_fetching && !items.length ? (
        <EmptyState query={query} />
      ) : isLoading || is_typing || (is_fetching && page === 1) ? (
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
