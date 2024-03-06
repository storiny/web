"use client";

import { clsx } from "clsx";
import dynamic from "next/dynamic";
import React from "react";

import { use_blog_context } from "~/common/context/blog";
import { dynamic_loader } from "~/common/dynamic";
import { StoryListSkeleton, VirtualizedStoryList } from "~/common/story";
import Divider from "~/components/divider";
import Input from "~/components/input";
import Option from "~/components/option";
import Select from "~/components/select";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import ErrorState from "~/entities/error-state";
import { use_debounce } from "~/hooks/use-debounce";
import { use_handle_dynamic_state } from "~/hooks/use-handle-dynamic-state";
import SearchIcon from "~/icons/search";
import {
  get_query_error_type,
  number_action,
  use_get_blog_published_stories_query
} from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import css from "~/theme/main.module.scss";
import { abbreviate_number } from "~/utils/abbreviate-number";

import DashboardTitle from "../../../../../common/dashboard-title";
import { PublishedStoriesProps } from "./published-stories.props";
import styles from "./styles.module.scss";

const EmptyState = dynamic(() => import("./empty-state"), {
  loading: dynamic_loader()
});

export type PublishedStoriesSortValue = "recent" | "old";

// Status header

const StatusHeader = ({
  published_story_count: published_story_count_prop
}: PublishedStoriesProps): React.ReactElement => {
  const blog = use_blog_context();
  const dispatch = use_app_dispatch();
  const published_story_count =
    use_app_selector(
      (state) => state.entities.blog_published_story_counts[blog.id]
    ) || 0;

  React.useEffect(() => {
    dispatch(
      number_action(
        "blog_published_story_counts",
        blog.id,
        published_story_count_prop
      )
    );
  }, [published_story_count_prop, dispatch, blog.id]);

  return (
    <div
      className={clsx(
        css["full-bleed"],
        css["dashboard-header"],
        css["flex-center"],
        styles["status-header"]
      )}
      style={{ justifyContent: "flex-start" }}
    >
      <Typography ellipsis level={"body2"} style={{ width: "100%" }}>
        {published_story_count === 0 ? (
          "No story has been published in this blog yet."
        ) : (
          <>
            There {published_story_count === 1 ? "is" : "are"}{" "}
            <span className={css["t-bold"]}>
              {abbreviate_number(published_story_count)}
            </span>{" "}
            {published_story_count === 1 ? "story" : "stories"} published in
            this blog.
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
  on_sort_change: (next_sort: PublishedStoriesSortValue) => void;
  query: string;
  sort: PublishedStoriesSortValue;
}): React.ReactElement => (
  <div
    className={clsx(
      css["flex-center"],
      css["full-bleed"],
      css["dashboard-header"],
      styles["control-bar"]
    )}
  >
    <Input
      decorator={<SearchIcon />}
      disabled={disabled}
      onChange={(event): void => on_query_change(event.target.value)}
      placeholder={"Search stories"}
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

const ContentPublishedStoriesClient = (
  props: PublishedStoriesProps
): React.ReactElement => {
  const blog = use_blog_context();
  const [sort, set_sort] = React.useState<PublishedStoriesSortValue>("recent");
  const [query, set_query] = React.useState<string>("");
  const [page, set_page] = React.useState<number>(1);
  use_handle_dynamic_state(1, set_page);
  use_handle_dynamic_state("", set_query);
  use_handle_dynamic_state("recent", set_sort);
  const debounced_query = use_debounce(query);
  const {
    data,
    isLoading: is_loading,
    isFetching: is_fetching,
    isError: is_error,
    error,
    refetch
  } = use_get_blog_published_stories_query({
    page,
    sort,
    query: debounced_query,
    blog_id: blog.id
  });
  const { items = [], has_more } = data || {};
  const is_typing = query !== debounced_query;

  const load_more = React.useCallback(
    () => set_page((prev_state) => prev_state + 1),
    []
  );

  const handle_sort_change = React.useCallback(
    (next_sort: PublishedStoriesSortValue) => {
      set_page(1);
      set_sort(next_sort);
    },
    []
  );

  const handle_query_change = React.useCallback((next_query: string) => {
    set_page(1);
    set_query(next_query);
  }, []);

  return (
    <React.Fragment>
      <DashboardTitle>Published stories</DashboardTitle>
      <StatusHeader {...props} />
      <ControlBar
        disabled={!query && !items.length}
        on_query_change={handle_query_change}
        on_sort_change={handle_sort_change}
        query={query}
        sort={sort}
      />
      {is_loading || is_typing || (is_fetching && page === 1) ? (
        <StoryListSkeleton />
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
        <EmptyState query={query} />
      ) : (
        <VirtualizedStoryList
          has_more={Boolean(has_more)}
          load_more={load_more}
          stories={items}
          story_props={{
            is_blog: true
          }}
        />
      )}
      <Spacer orientation={"vertical"} size={10} />
    </React.Fragment>
  );
};

export default ContentPublishedStoriesClient;
