"use client";

import { clsx } from "clsx";
import dynamic from "next/dynamic";
import NextLink from "next/link";
import React from "react";

import { dynamic_loader } from "~/common/dynamic";
import { StoryListSkeleton, VirtualizedStoryList } from "~/common/story";
import Button from "~/components/button";
import Divider from "~/components/divider";
import Input from "~/components/input";
import Option from "~/components/option";
import Select from "~/components/select";
import Spacer from "~/components/spacer";
import Tab from "~/components/tab";
import Tabs from "~/components/tabs";
import TabsList from "~/components/tabs-list";
import Typography from "~/components/typography";
import ErrorState from "~/entities/error-state";
import { use_debounce } from "~/hooks/use-debounce";
import PlusIcon from "~/icons/plus";
import SearchIcon from "~/icons/search";
import {
  get_query_error_type,
  self_action,
  use_get_stories_query
} from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import css from "~/theme/main.module.scss";
import { abbreviate_number } from "~/utils/abbreviate-number";

import DashboardTitle from "../../dashboard-title";
import ContentStoriesRightSidebar from "./right-sidebar";
import { StoriesProps } from "./stories.props";
import styles from "./styles.module.scss";

const EmptyState = dynamic(() => import("./empty-state"), {
  loading: dynamic_loader()
});

type SortOrder = "dsc" | "asc";

export type StoriesTabValue = "published" | "deleted";
export type StoriesSortValue =
  | "recent"
  | "old"
  | `popular-${SortOrder}`
  | `likes-${SortOrder}`;

// Page header tabs

const PageHeader = ({
  value,
  on_change
}: {
  on_change: (next_value: StoriesTabValue) => void;
  value: StoriesTabValue;
}): React.ReactElement => (
  <Tabs
    className={clsx(
      css["full-bleed"],
      css["page-header"],
      css["dashboard-header"],
      css["with-page-title"],
      styles.x,
      styles.tabs
    )}
    onValueChange={(next_value): void =>
      on_change(next_value as StoriesTabValue)
    }
    value={value}
  >
    <TabsList className={clsx(css["full-w"], styles.x, styles["tabs-list"])}>
      <Tab aria-controls={undefined} value={"published"}>
        Published
      </Tab>
      <Tab aria-controls={undefined} value={"deleted"}>
        Deleted
      </Tab>
    </TabsList>
  </Tabs>
);

// Sort control

const SortControl = ({
  tab,
  sort,
  on_sort_change,
  disabled
}: {
  disabled?: boolean;
  on_sort_change: (next_sort: StoriesSortValue) => void;
  sort: StoriesSortValue;
  tab: StoriesTabValue;
}): React.ReactElement => (
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
    {tab !== "deleted" && (
      <React.Fragment>
        <Option value={"popular-dsc"}>Most popular</Option>
        <Option value={"popular-asc"}>Least popular</Option>
        <Option value={"likes-dsc"}>Most liked</Option>
        <Option value={"likes-asc"}>Least liked</Option>
      </React.Fragment>
    )}
  </Select>
);

// Status header

const StatusHeader = ({
  tab,
  published_story_count: published_story_count_prop,
  deleted_story_count: deleted_story_count_prop,
  disabled,
  on_sort_change,
  sort
}: {
  disabled?: boolean;
  on_sort_change: (next_sort: StoriesSortValue) => void;
  sort: StoriesSortValue;
  tab: StoriesTabValue;
} & StoriesProps): React.ReactElement => {
  const dispatch = use_app_dispatch();
  const published_story_count =
    use_app_selector((state) => state.entities.self_published_story_count) || 0;
  const deleted_story_count =
    use_app_selector((state) => state.entities.self_deleted_story_count) || 0;
  const count_param =
    tab === "published" ? published_story_count : deleted_story_count;

  React.useEffect(() => {
    [
      self_action("self_published_story_count", published_story_count_prop),
      self_action("self_deleted_story_count", deleted_story_count_prop)
    ].forEach(dispatch);
  }, [deleted_story_count_prop, dispatch, published_story_count_prop]);

  return (
    <div
      className={clsx(
        css["full-bleed"],
        css["dashboard-header"],
        css["flex-center"],
        styles["status-header"]
      )}
    >
      <Typography ellipsis level={"body2"}>
        {count_param === 0 ? (
          tab === "published" ? (
            "You have not published any stories yet."
          ) : (
            "You have no deleted stories."
          )
        ) : (
          <>
            You have{" "}
            <span className={css["t-bold"]}>
              {abbreviate_number(count_param)}
            </span>{" "}
            {tab === "published" ? "published" : "deleted"}{" "}
            {count_param === 1 ? "story" : "stories"}
          </>
        )}
      </Typography>
      <Spacer className={css["f-grow"]} size={2} />
      {tab === "published" ? (
        <Button
          as={NextLink}
          check_auth
          className={clsx(styles.x, styles["header-button"])}
          decorator={<PlusIcon />}
          href={"/new"}
        >
          New story
        </Button>
      ) : (
        <React.Fragment>
          <Divider orientation={"vertical"} />
          <SortControl
            disabled={disabled}
            on_sort_change={on_sort_change}
            sort={sort}
            tab={tab}
          />
        </React.Fragment>
      )}
    </div>
  );
};

// Control bar

const ControlBar = ({
  tab,
  query,
  sort,
  on_sort_change,
  on_query_change,
  disabled
}: {
  disabled?: boolean;
  on_query_change: (next_query: string) => void;
  on_sort_change: (next_sort: StoriesSortValue) => void;
  query: string;
  sort: StoriesSortValue;
  tab: StoriesTabValue;
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
      placeholder={"Search your published stories"}
      size={"lg"}
      type={"search"}
      value={query}
    />
    <Divider orientation={"vertical"} />
    <SortControl
      disabled={disabled}
      on_sort_change={on_sort_change}
      sort={sort}
      tab={tab}
    />
  </div>
);

const ContentStoriesClient = (props: StoriesProps): React.ReactElement => {
  const [sort, set_sort] = React.useState<StoriesSortValue>("recent");
  const [query, set_query] = React.useState<string>("");
  const [value, set_value] = React.useState<StoriesTabValue>("published");
  const [page, set_page] = React.useState<number>(1);
  const debounced_query = use_debounce(query);
  const {
    data,
    isLoading: is_loading,
    isFetching: is_fetching,
    isError: is_error,
    error,
    refetch
  } = use_get_stories_query({
    page,
    sort,
    query: debounced_query,
    type: value
  });
  const { items = [], has_more } = data || {};
  const is_typing = query !== debounced_query;

  const load_more = React.useCallback(
    () => set_page((prev_state) => prev_state + 1),
    []
  );

  const handle_change = React.useCallback((next_value: StoriesTabValue) => {
    set_page(1);
    set_sort("recent");
    set_query("");
    set_value(next_value);
  }, []);

  const handle_sort_change = React.useCallback(
    (next_sort: StoriesSortValue) => {
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
      <main data-root={"true"}>
        <DashboardTitle>Stories</DashboardTitle>
        <PageHeader on_change={handle_change} value={value} />
        <StatusHeader
          {...props}
          disabled={!items.length}
          on_sort_change={handle_sort_change}
          sort={sort}
          tab={value}
        />
        {value === "published" && (
          <ControlBar
            disabled={!items.length}
            on_query_change={handle_query_change}
            on_sort_change={handle_sort_change}
            query={query}
            sort={sort}
            tab={value}
          />
        )}
        {is_loading || is_typing || (is_fetching && page === 1) ? (
          <StoryListSkeleton is_small />
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
          <EmptyState query={query} value={value} />
        ) : (
          <VirtualizedStoryList
            has_more={Boolean(has_more)}
            load_more={load_more}
            skeleton_props={{
              is_small: true
            }}
            stories={items}
            story_props={{
              is_extended: true,
              is_deleted: value === "deleted"
            }}
          />
        )}
        <Spacer orientation={"vertical"} size={10} />
      </main>
      <ContentStoriesRightSidebar tab={value} />
    </React.Fragment>
  );
};

export default ContentStoriesClient;
