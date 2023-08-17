"use client";

import { clsx } from "clsx";
import dynamic from "next/dynamic";
import React from "react";

import { StoryListSkeleton, VirtualizedStoryList } from "~/common/story";
import SuspenseLoader from "~/common/suspense-loader";
import Tab from "~/components/Tab";
import Tabs from "~/components/Tabs";
import TabsList from "~/components/TabsList";
import ErrorState from "~/entities/ErrorState";
import { getQueryErrorType, useGetHomeFeedQuery } from "~/redux/features";

import styles from "./styles.module.scss";

const EmptyState = dynamic(() => import("./empty-state"), {
  loading: () => <SuspenseLoader />
});

export type IndexTabValue = "suggested" | "friends-and-following";

// Page header tabs

const PageHeader = ({
  value,
  onChange
}: {
  onChange: (newValue: IndexTabValue) => void;
  value: IndexTabValue;
}): React.ReactElement => (
  <Tabs
    className={clsx("full-bleed", "page-header", styles.x, styles.tabs)}
    onValueChange={(newValue): void => onChange(newValue as IndexTabValue)}
    value={value}
  >
    <TabsList className={clsx("full-w", styles.x, styles["tabs-list"])}>
      <Tab aria-controls={undefined} value={"suggested"}>
        Suggested
      </Tab>
      <Tab aria-controls={undefined} value={"friends-and-following"}>
        Friends & following
      </Tab>
    </TabsList>
  </Tabs>
);

const Page = (): React.ReactElement => {
  const [value, setValue] = React.useState<IndexTabValue>("suggested");
  const [page, setPage] = React.useState<number>(1);
  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetHomeFeedQuery({
      page,
      type: value
    });
  const { items = [], hasMore } = data || {};

  const loadMore = React.useCallback(
    () => setPage((prevState) => prevState + 1),
    []
  );

  const handleChange = React.useCallback(
    (newValue: IndexTabValue) => setValue(newValue),
    []
  );

  return (
    <>
      <PageHeader onChange={handleChange} value={value} />
      {isLoading ? <StoryListSkeleton /> : null}
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
          stories={items}
        />
      )}
    </>
  );
};

export default Page;
