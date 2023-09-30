"use client";

import { clsx } from "clsx";
import dynamic from "next/dynamic";
import React from "react";

import { dynamic_loader } from "~/common/dynamic";
import { GetTagResponse } from "~/common/grpc";
import { StoryListSkeleton, VirtualizedStoryList } from "~/common/story";
import Divider from "../../../../../../../packages/ui/src/components/divider";
import Input from "../../../../../../../packages/ui/src/components/input";
import Option from "../../../../../../../packages/ui/src/components/option";
import Select from "../../../../../../../packages/ui/src/components/select";
import ErrorState from "../../../../../../../packages/ui/src/entities/error-state";
import { use_debounce } from "../../../../../../../packages/ui/src/hooks/use-debounce";
import { use_media_query } from "../../../../../../../packages/ui/src/hooks/use-media-query";
import SearchIcon from "../../../../../../../packages/ui/src/icons/search";
import {
  get_query_error_type,
  use_get_tag_stories_query
} from "~/redux/features";
import { BREAKPOINTS } from "~/theme/breakpoints";

import styles from "./styles.module.scss";

const EmptyState = dynamic(() => import("./empty-state"), {
  loading: dynamic_loader()
});
const SuspendedContent = dynamic(() => import("./content"), {
  loading: dynamic_loader()
});

export type TagTabValue = "popular" | "recent";

interface Props {
  tag: GetTagResponse;
}

// Page header

const PageHeader = ({
  query,
  sort,
  tag_name,
  on_sort_change,
  on_query_change,
  disabled
}: {
  disabled?: boolean;
  on_query_change: (next_query: string) => void;
  on_sort_change: (next_sort: TagTabValue) => void;
  query: string;
  sort: TagTabValue;
  tag_name: string;
}): React.ReactElement => (
  <div
    className={clsx(
      "flex-center",
      "full-bleed",
      "page-header",
      styles["page-header"]
    )}
  >
    <Input
      decorator={<SearchIcon />}
      disabled={disabled}
      onChange={(event): void => on_query_change(event.target.value)}
      placeholder={`Search in #${tag_name}`}
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
      <Option value={"popular"}>Popular</Option>
      <Option value={"recent"}>Recent</Option>
    </Select>
  </div>
);

const Page = ({ tag }: Props): React.ReactElement => {
  const is_smaller_than_tablet = use_media_query(BREAKPOINTS.down("tablet"));
  const [sort, set_sort] = React.useState<TagTabValue>("popular");
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
  } = use_get_tag_stories_query({
    page,
    sort,
    tag_name: tag.name,
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

  const handle_change = React.useCallback((next_value: TagTabValue) => {
    set_page(1);
    set_sort(next_value);
  }, []);

  return (
    <>
      {is_smaller_than_tablet && <SuspendedContent tag={tag} />}
      <PageHeader
        disabled={!items.length}
        on_query_change={handle_query_change}
        on_sort_change={handle_change}
        query={query}
        sort={sort}
        tag_name={tag.name}
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

export default Page;
