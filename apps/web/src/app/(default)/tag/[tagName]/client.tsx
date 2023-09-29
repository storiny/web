"use client";

import { clsx } from "clsx";
import dynamic from "next/dynamic";
import React from "react";

import { dynamicLoader } from "~/common/dynamic";
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
      <Option value={"popular"}>Popular</Option>
      <Option value={"recent"}>Recent</Option>
    </Select>
  </div>
);

const Page = ({ tag }: Props): React.ReactElement => {
  const is_smaller_than_tablet = use_media_query(BREAKPOINTS.down("tablet"));
  const [sort, set_sort] = React.useState<TagTabValue>("popular");
  const [query, setQuery] = React.useState<string>("");
  const [page, set_page] = React.useState<number>(1);
  const debounced_query = use_debounce(query);
  const { data, isLoading, is_fetching, isError, error, refetch } =
    use_get_tag_stories_query({
      page,
      sort,
      tagName: tag.name,
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

  const handleChange = React.useCallback((newValue: TagTabValue) => {
    set_page(1);
    set_sort(newValue);
  }, []);

  return (
    <>
      {is_smaller_than_tablet && <SuspendedContent tag={tag} />}
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

export default Page;
