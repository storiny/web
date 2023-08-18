"use client";

import { clsx } from "clsx";
import dynamic from "next/dynamic";
import NextLink from "next/link";
import React from "react";

import { StoryListSkeleton, VirtualizedStoryList } from "~/common/story";
import SuspenseLoader from "~/common/suspense-loader";
import Button from "~/components/Button";
import Divider from "~/components/Divider";
import Input from "~/components/Input";
import Option from "~/components/Option";
import Select from "~/components/Select";
import Spacer from "~/components/Spacer";
import Tab from "~/components/Tab";
import Tabs from "~/components/Tabs";
import TabsList from "~/components/TabsList";
import Typography from "~/components/Typography";
import ErrorState from "~/entities/ErrorState";
import { useDebounce } from "~/hooks/useDebounce";
import PlusIcon from "~/icons/Plus";
import SearchIcon from "~/icons/Search";
import { getQueryErrorType, useGetStoriesQuery } from "~/redux/features";
import { abbreviateNumber } from "~/utils/abbreviateNumber";

import DashboardTitle from "../../dashboard-title";
import ContentStoriesRightSidebar from "./right-sidebar";
import { StoriesProps } from "./stories.props";
import styles from "./styles.module.scss";

const EmptyState = dynamic(() => import("./empty-state"), {
  loading: () => <SuspenseLoader />
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
    slotProps={{
      trigger: {
        className: clsx("focus-invert", styles.x, styles["select-trigger"])
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
  published_stories_count,
  deleted_stories_count,
  disabled,
  onSortChange,
  sort
}: {
  disabled?: boolean;
  onSortChange: (newSort: StoriesSortValue) => void;
  sort: StoriesSortValue;
  tab: StoriesTabValue;
} & StoriesProps): React.ReactElement => {
  const count_param =
    tab === "published" ? published_stories_count : deleted_stories_count;
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
            <span className={"t-bold"}>{abbreviateNumber(count_param)}</span>{" "}
            {tab === "published" ? "published" : "deleted"}{" "}
            {count_param === 1 ? "story" : "stories"}
          </>
        )}
      </Typography>
      <Spacer className={"f-grow"} size={2} />
      {tab === "published" ? (
        <Button
          as={NextLink}
          checkAuth
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
      slotProps={{
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
  const [sort, setSort] = React.useState<StoriesSortValue>("recent");
  const [query, setQuery] = React.useState<string>("");
  const [value, setValue] = React.useState<StoriesTabValue>("published");
  const [page, setPage] = React.useState<number>(1);
  const debouncedQuery = useDebounce(query);
  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetStoriesQuery({
      page,
      sort,
      query: debouncedQuery,
      type: value
    });
  const { items = [], hasMore } = data || {};
  const isTyping = query !== debouncedQuery;

  const loadMore = React.useCallback(
    () => setPage((prevState) => prevState + 1),
    []
  );

  const handleChange = React.useCallback(
    (newValue: StoriesTabValue) => setValue(newValue),
    []
  );

  const handleSortChange = React.useCallback(
    (newSort: StoriesSortValue) => setSort(newSort),
    []
  );

  const handleQueryChange = React.useCallback(
    (newQuery: string) => setQuery(newQuery),
    []
  );

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
        {isLoading || isTyping ? <StoryListSkeleton isSmall /> : null}
        {isError ? (
          <ErrorState
            autoSize
            componentProps={{
              button: { loading: isFetching }
            }}
            retry={refetch}
            type={getQueryErrorType(error)}
          />
        ) : !isFetching && !items.length ? (
          <EmptyState value={value} />
        ) : (
          <VirtualizedStoryList
            hasMore={Boolean(hasMore)}
            loadMore={loadMore}
            skeletonProps={{
              isSmall: true
            }}
            stories={items}
            storyProps={{
              isExtended: true,
              isDeleted: value === "deleted"
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
