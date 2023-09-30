"use client";

import { clsx } from "clsx";
import dynamic from "next/dynamic";
import React from "react";

import { dynamic_loader } from "~/common/dynamic";
import { TagListSkeleton, VirtualizedTagList } from "~/common/tag";
import Divider from "../../../../../../../../../../../../packages/ui/src/components/divider";
import Input from "../../../../../../../../../../../../packages/ui/src/components/input";
import Option from "../../../../../../../../../../../../packages/ui/src/components/option";
import Select from "../../../../../../../../../../../../packages/ui/src/components/select";
import Spacer from "../../../../../../../../../../../../packages/ui/src/components/spacer";
import Typography from "../../../../../../../../../../../../packages/ui/src/components/typography";
import ErrorState from "../../../../../../../../../../../../packages/ui/src/entities/error-state";
import { use_debounce } from "../../../../../../../../../../../../packages/ui/src/hooks/use-debounce";
import SearchIcon from "../../../../../../../../../../../../packages/ui/src/icons/search";
import {
  get_query_error_type,
  self_action,
  use_get_followed_tags_query
} from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import { abbreviate_number } from "../../../../../../../../../../../../packages/ui/src/utils/abbreviate-number";

import DashboardTitle from "../../../dashboard-title";
import styles from "./styles.module.scss";
import { TagsProps } from "./tags.props";

const EmptyState = dynamic(() => import("./empty-state"), {
  loading: dynamic_loader()
});

type SortOrder = "dsc" | "asc";

export type TagsSortValue = "recent" | "old" | `popular-${SortOrder}`;

// Status header

const StatusHeader = ({
  followed_tag_count: followed_tag_count_prop
}: TagsProps): React.ReactElement => {
  const dispatch = use_app_dispatch();
  const followed_tag_count =
    use_app_selector((state) => state.entities.self_followed_tag_count) || 0;

  React.useEffect(() => {
    dispatch(self_action("self_followed_tag_count", followed_tag_count_prop));
  }, [dispatch, followed_tag_count_prop]);

  return (
    <div
      className={clsx(
        "full-bleed",
        "dashboard-header",
        "flex-center",
        styles["status-header"]
      )}
    >
      <Typography ellipsis level={"body2"}>
        {followed_tag_count === 0 ? (
          "You have not followed any tags."
        ) : (
          <>
            You are following{" "}
            <span className={"t-bold"}>
              {abbreviate_number(followed_tag_count)}
            </span>{" "}
            {followed_tag_count === 1 ? "tag" : "tags"}.
          </>
        )}
      </Typography>
    </div>
  );
};

// Control bar

const ControlBar = ({
  query,
  sort,
  on_sort_change,
  on_query_change,
  disabled
}: {
  disabled?: boolean;
  on_query_change: (next_query: string) => void;
  on_sort_change: (next_sort: TagsSortValue) => void;
  query: string;
  sort: TagsSortValue;
}): React.ReactElement => (
  <div
    className={clsx(
      "flex-center",
      "full-bleed",
      "dashboard-header",
      styles["control-bar"]
    )}
  >
    <Input
      decorator={<SearchIcon />}
      disabled={disabled}
      onChange={(event): void => on_query_change(event.target.value)}
      placeholder={"Search tags"}
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
      <Option value={"popular-dsc"}>Most popular</Option>
      <Option value={"popular-asc"}>Least popular</Option>
    </Select>
  </div>
);

const ContentTagsClient = (props: TagsProps): React.ReactElement => {
  const [sort, set_sort] = React.useState<TagsSortValue>("recent");
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
  } = use_get_followed_tags_query({
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

  const handle_sort_change = React.useCallback((next_sort: TagsSortValue) => {
    set_page(1);
    set_sort(next_sort);
  }, []);

  const handle_query_change = React.useCallback((next_query: string) => {
    set_page(1);
    set_query(next_query);
  }, []);

  return (
    <React.Fragment>
      <DashboardTitle>Followed tags</DashboardTitle>
      <StatusHeader {...props} />
      <ControlBar
        disabled={!items.length}
        on_query_change={handle_query_change}
        on_sort_change={handle_sort_change}
        query={query}
        sort={sort}
      />
      {is_loading || is_typing || (is_fetching && page === 1) ? (
        <TagListSkeleton />
      ) : is_error ? (
        <ErrorState
          auto_size
          component_props={{
            button: { loading: is_fetching }
          }}
          retry={refetch}
          type={get_query_error_type(error)}
        />
      ) : !is_fetching && !items.length ? (
        <EmptyState query={debounced_query} />
      ) : (
        <VirtualizedTagList
          has_more={Boolean(has_more)}
          load_more={load_more}
          tags={items}
        />
      )}
      <Spacer orientation={"vertical"} size={10} />
    </React.Fragment>
  );
};

export default ContentTagsClient;
