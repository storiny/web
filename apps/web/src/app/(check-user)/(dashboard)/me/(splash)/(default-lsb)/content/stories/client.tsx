"use client";

import { clsx } from "clsx";
import dynamic from "next/dynamic";
import NextLink from "next/link";
import React from "react";

import { dynamicLoader } from "~/common/dynamic";
import { StoryListSkeleton, VirtualizedStoryList } from "~/common/story";
import Button from "../../../../../../../../../../../packages/ui/src/components/button";
import Divider from "../../../../../../../../../../../packages/ui/src/components/divider";
import Input from "../../../../../../../../../../../packages/ui/src/components/input";
import Option from "../../../../../../../../../../../packages/ui/src/components/option";
import Select from "../../../../../../../../../../../packages/ui/src/components/select";
import Spacer from "../../../../../../../../../../../packages/ui/src/components/spacer";
import Tab from "../../../../../../../../../../../packages/ui/src/components/tab";
import Tabs from "../../../../../../../../../../../packages/ui/src/components/tabs";
import TabsList from "../../../../../../../../../../../packages/ui/src/components/tabs-list";
import Typography from "../../../../../../../../../../../packages/ui/src/components/typography";
import ErrorState from "../../../../../../../../../../../packages/ui/src/entities/error-state";
import { use_debounce } from "../../../../../../../../../../../packages/ui/src/hooks/use-debounce";
import PlusIcon from "../../../../../../../../../../../packages/ui/src/icons/plus";
import SearchIcon from "../../../../../../../../../../../packages/ui/src/icons/search";
import {
  get_query_error_type,
  self_action,
  use_get_stories_query
} from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import { abbreviate_number } from "../../../../../../../../../../../packages/ui/src/utils/abbreviate-number";

import DashboardTitle from "../../dashboard-title";
import ContentStoriesRightSidebar from "./right-sidebar";
import { StoriesProps } from "./stories.props";
import styles from "./styles.module.scss";

const EmptyState = dynamic(() => import("./empty-state"), {
  loading: dynamicLoader()
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
  onChange
}: {
  onChange: (newValue: StoriesTabValue) => void;
  value: StoriesTabValue;
}): React.ReactElement => (
  <Tabs
    className={clsx(
      "full-bleed",
      "page-header",
      "dashboard-header",
      "with-page-title",
      styles.x,
      styles.tabs
    )}
    onValueChange={(newValue): void => onChange(newValue as StoriesTabValue)}
    value={value}
  >
    <TabsList className={clsx("full-w", styles.x, styles["tabs-list"])}>
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
  onSortChange,
  disabled
}: {
  disabled?: boolean;
  onSortChange: (newSort: StoriesSortValue) => void;
  sort: StoriesSortValue;
  tab: StoriesTabValue;
}): React.ReactElement => (
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
  published_story_count,
  deleted_story_count,
  disabled,
  onSortChange,
  sort
}: {
  disabled?: boolean;
  onSortChange: (newSort: StoriesSortValue) => void;
  sort: StoriesSortValue;
  tab: StoriesTabValue;
} & StoriesProps): React.ReactElement => {
  const dispatch = use_app_dispatch();
  const publishedStoryCount =
    use_app_selector((state) => state.entities.self_published_story_count) || 0;
  const deletedStoryCount =
    use_app_selector((state) => state.entities.self_deleted_story_count) || 0;
  const count_param =
    tab === "published" ? publishedStoryCount : deletedStoryCount;

  React.useEffect(() => {
    [
      self_action("self_published_story_count", published_story_count),
      self_action("self_deleted_story_count", deleted_story_count)
    ].forEach(dispatch);
  }, [deleted_story_count, dispatch, published_story_count]);

  return (
    <div
      className={clsx(
        "full-bleed",
        "dashboard-header",
        "flex-center",
        styles.x,
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
            <span className={"t-bold"}>{abbreviate_number(count_param)}</span>{" "}
            {tab === "published" ? "published" : "deleted"}{" "}
            {count_param === 1 ? "story" : "stories"}
          </>
        )}
      </Typography>
      <Spacer className={"f-grow"} size={2} />
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
            onSortChange={onSortChange}
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
  onSortChange,
  onQueryChange,
  disabled
}: {
  disabled?: boolean;
  onQueryChange: (newQuery: string) => void;
  onSortChange: (newSort: StoriesSortValue) => void;
  query: string;
  sort: StoriesSortValue;
  tab: StoriesTabValue;
}): React.ReactElement => (
  <div
    className={clsx(
      "flex-center",
      "full-bleed",
      "dashboard-header",
      styles.x,
      styles["control-bar"]
    )}
  >
    <Input
      decorator={<SearchIcon />}
      disabled={disabled}
      onChange={(event): void => onQueryChange(event.target.value)}
      placeholder={"Search your published stories"}
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
    <SortControl
      disabled={disabled}
      onSortChange={onSortChange}
      sort={sort}
      tab={tab}
    />
  </div>
);

const ContentStoriesClient = (props: StoriesProps): React.ReactElement => {
  const [sort, set_sort] = React.useState<StoriesSortValue>("recent");
  const [query, setQuery] = React.useState<string>("");
  const [value, setValue] = React.useState<StoriesTabValue>("published");
  const [page, set_page] = React.useState<number>(1);
  const debounced_query = use_debounce(query);
  const { data, isLoading, is_fetching, isError, error, refetch } =
    use_get_stories_query({
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

  const handleChange = React.useCallback((newValue: StoriesTabValue) => {
    set_page(1);
    set_sort("recent");
    setQuery("");
    setValue(newValue);
  }, []);

  const handleSortChange = React.useCallback((newSort: StoriesSortValue) => {
    set_page(1);
    set_sort(newSort);
  }, []);

  const handleQueryChange = React.useCallback((newQuery: string) => {
    set_page(1);
    setQuery(newQuery);
  }, []);

  React.useEffect(() => {
    set_page(1);
  }, [value]);

  return (
    <React.Fragment>
      <main>
        <DashboardTitle>Stories</DashboardTitle>
        <PageHeader onChange={handleChange} value={value} />
        <StatusHeader
          {...props}
          disabled={!items.length}
          onSortChange={handleSortChange}
          sort={sort}
          tab={value}
        />
        {value === "published" && (
          <ControlBar
            disabled={!items.length}
            onQueryChange={handleQueryChange}
            onSortChange={handleSortChange}
            query={query}
            sort={sort}
            tab={value}
          />
        )}
        {isLoading || is_typing || (is_fetching && page === 1) ? (
          <StoryListSkeleton is_small />
        ) : isError ? (
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
            skeletonProps={{
              is_small: true
            }}
            stories={items}
            storyProps={{
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
