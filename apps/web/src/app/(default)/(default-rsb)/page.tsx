"use client";

import { clsx } from "clsx";
import dynamic from "next/dynamic";
import React from "react";

import { dynamicLoader } from "~/common/dynamic";
import { StoryListSkeleton, VirtualizedStoryList } from "~/common/story";
import Tab from "../../../../../../packages/ui/src/components/tab";
import Tabs from "../../../../../../packages/ui/src/components/tabs";
import TabsList from "../../../../../../packages/ui/src/components/tabs-list";
import ErrorState from "../../../../../../packages/ui/src/entities/error-state";
import {
  get_query_error_type,
  use_get_home_feed_query
} from "~/redux/features";

import styles from "./styles.module.scss";

const EmptyState = dynamic(() => import("./empty-state"), {
  loading: dynamicLoader()
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
  const [page, set_page] = React.useState<number>(1);
  const { data, isLoading, is_fetching, isError, error, refetch } =
    use_get_home_feed_query({
      page,
      type: value
    });
  const { items = [], has_more } = data || {};

  const load_more = React.useCallback(
    () => set_page((prev_state) => prev_state + 1),
    []
  );

  const handleChange = React.useCallback((newValue: IndexTabValue) => {
    set_page(1);
    setValue(newValue);
  }, []);

  return (
    <>
      <PageHeader onChange={handleChange} value={value} />
      {isLoading || (is_fetching && page === 1) ? (
        <StoryListSkeleton />
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
        <EmptyState value={value} />
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
