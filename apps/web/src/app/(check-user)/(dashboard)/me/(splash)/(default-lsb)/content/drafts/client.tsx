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
import { getQueryErrorType, useGetDraftsQuery } from "~/redux/features";
import { abbreviateNumber } from "~/utils/abbreviateNumber";

import DashboardTitle from "../../dashboard-title";
import { DraftsProps } from "./drafts.props";
import ContentDraftsRightSidebar from "./right-sidebar";
import styles from "./styles.module.scss";

const EmptyState = dynamic(() => import("./empty-state"), {
  loading: () => <SuspenseLoader />
});

export type DraftsTabValue = "pending" | "deleted";
export type DraftsSortValue = "recent" | "old";

// Page header tabs

const PageHeader = ({
  value,
  onChange
}: {
  onChange: (newValue: DraftsTabValue) => void;
  value: DraftsTabValue;
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
    onValueChange={(newValue): void => onChange(newValue as DraftsTabValue)}
    value={value}
  >
    <TabsList className={clsx("full-w", styles.x, styles["tabs-list"])}>
      <Tab aria-controls={undefined} value={"pending"}>
        Pending
      </Tab>
      <Tab aria-controls={undefined} value={"deleted"}>
        Deleted
      </Tab>
    </TabsList>
  </Tabs>
);

// Sort control

const SortControl = ({
  sort,
  onSortChange,
  disabled
}: {
  disabled?: boolean;
  onSortChange: (newSort: DraftsSortValue) => void;
  sort: DraftsSortValue;
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
  </Select>
);

// Status header

const StatusHeader = ({
  tab,
  pending_drafts_count,
  deleted_drafts_count,
  disabled,
  onSortChange,
  sort
}: {
  disabled?: boolean;
  onSortChange: (newSort: DraftsSortValue) => void;
  sort: DraftsSortValue;
  tab: DraftsTabValue;
} & Pick<
  DraftsProps,
  "pending_drafts_count" | "deleted_drafts_count"
>): React.ReactElement => {
  const count_param =
    tab === "pending" ? pending_drafts_count : deleted_drafts_count;
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
          `You have no ${tab === "pending" ? "pending" : "deleted"} drafts.`
        ) : (
          <>
            You have{" "}
            <span className={"t-bold"}>{abbreviateNumber(count_param)}</span>{" "}
            {tab === "pending" ? "pending" : "deleted"}{" "}
            {count_param === 1 ? "draft" : "drafts"}
          </>
        )}
      </Typography>
      <Spacer className={"f-grow"} size={2} />
      {tab === "pending" ? (
        <Button
          as={NextLink}
          checkAuth
          className={clsx(styles.x, styles["header-button"])}
          decorator={<PlusIcon />}
          href={"/new"}
        >
          New draft
        </Button>
      ) : (
        <React.Fragment>
          <Divider orientation={"vertical"} />
          <SortControl
            disabled={disabled}
            onSortChange={onSortChange}
            sort={sort}
          />
        </React.Fragment>
      )}
    </div>
  );
};

// Control bar

const ControlBar = ({
  query,
  sort,
  onSortChange,
  onQueryChange,
  disabled
}: {
  disabled?: boolean;
  onQueryChange: (newQuery: string) => void;
  onSortChange: (newSort: DraftsSortValue) => void;
  query: string;
  sort: DraftsSortValue;
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
      placeholder={"Search your pending drafts"}
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
    <SortControl disabled={disabled} onSortChange={onSortChange} sort={sort} />
  </div>
);

const ContentDraftsClient = (props: DraftsProps): React.ReactElement => {
  const { latest_draft, deleted_drafts_count, pending_drafts_count } = props;
  const [sort, setSort] = React.useState<DraftsSortValue>("recent");
  const [query, setQuery] = React.useState<string>("");
  const [value, setValue] = React.useState<DraftsTabValue>("pending");
  const [page, setPage] = React.useState<number>(1);
  const debouncedQuery = useDebounce(query);
  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetDraftsQuery({
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

  const handleChange = React.useCallback((newValue: DraftsTabValue) => {
    setPage(1);
    setSort("recent");
    setQuery("");
    setValue(newValue);
  }, []);

  const handleSortChange = React.useCallback(
    (newSort: DraftsSortValue) => setSort(newSort),
    []
  );

  const handleQueryChange = React.useCallback(
    (newQuery: string) => setQuery(newQuery),
    []
  );

  return (
    <React.Fragment>
      <main>
        <DashboardTitle>Drafts</DashboardTitle>
        <PageHeader onChange={handleChange} value={value} />
        <StatusHeader
          deleted_drafts_count={deleted_drafts_count}
          disabled={!items.length}
          onSortChange={handleSortChange}
          pending_drafts_count={pending_drafts_count}
          sort={sort}
          tab={value}
        />
        {value === "pending" && (
          <ControlBar
            disabled={!items.length}
            onQueryChange={handleQueryChange}
            onSortChange={handleSortChange}
            query={query}
            sort={sort}
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
              isDraft: true,
              isDeleted: value === "deleted"
            }}
          />
        )}
        <Spacer orientation={"vertical"} size={10} />
      </main>
      <ContentDraftsRightSidebar latest_draft={latest_draft} tab={value} />
    </React.Fragment>
  );
};

export default ContentDraftsClient;
