"use client";

import { clsx } from "clsx";
import dynamic from "next/dynamic";
import React from "react";

import { dynamic_loader } from "~/common/dynamic";
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
  loading: dynamic_loader()
});

export type IndexTabValue = "suggested" | "friends-and-following";

// Page header tabs

const PageHeader = ({
  value,
  on_change
}: {
  on_change: (next_value: IndexTabValue) => void;
  value: IndexTabValue;
}): React.ReactElement => (
  <Tabs
    className={clsx("full-bleed", "page-header", styles.x, styles.tabs)}
    onValueChange={(next_value: IndexTabValue): void => on_change(next_value)}
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
  const [value, set_value] = React.useState<IndexTabValue>("suggested");
  const [page, set_page] = React.useState<number>(1);
  const {
    data,
    isLoading: is_loading,
    isFetching: is_fetching,
    isError: is_error,
    error,
    refetch
  } = use_get_home_feed_query({
    page,
    type: value
  });
  const { items = [], has_more } = data || {};

  const load_more = React.useCallback(
    () => set_page((prev_state) => prev_state + 1),
    []
  );

  const handle_change = React.useCallback((next_value: IndexTabValue) => {
    set_page(1);
    set_value(next_value);
  }, []);

  return (
    <>
      <PageHeader on_change={handle_change} value={value} />
      {is_loading || (is_fetching && page === 1) ? (
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
