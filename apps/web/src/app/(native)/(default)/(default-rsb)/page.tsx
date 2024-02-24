"use client";

import { clsx } from "clsx";
import dynamic from "next/dynamic";
import { useSearchParams as use_search_params } from "next/navigation";
import React from "react";

import { dynamic_loader } from "~/common/dynamic";
import { StoryListSkeleton, VirtualizedStoryList } from "~/common/story";
import { use_app_router } from "~/common/utils";
import Tab from "~/components/tab";
import Tabs from "~/components/tabs";
import TabsList from "~/components/tabs-list";
import ErrorState from "~/entities/error-state";
import {
  get_query_error_type,
  select_is_logged_in,
  use_get_home_feed_query
} from "~/redux/features";
import { use_app_selector } from "~/redux/hooks";
import css from "~/theme/main.module.scss";

import styles from "./styles.module.scss";

const EmptyState = dynamic(() => import("./empty-state"), {
  loading: dynamic_loader()
});

const Onboarding = dynamic(() => import("../../onboarding"));

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
    className={clsx(
      css["full-bleed"],
      css["page-header"],
      styles.x,
      styles.tabs
    )}
    onValueChange={(next_value): void => on_change(next_value as IndexTabValue)}
    value={value}
  >
    <TabsList className={clsx(css["full-w"], styles.x, styles["tabs-list"])}>
      <Tab aria-controls={undefined} value={"suggested"}>
        Suggested
      </Tab>
      <Tab aria-controls={undefined} value={"friends-and-following"}>
        Friends & following
      </Tab>
    </TabsList>
  </Tabs>
);

const OnboardingItem = (): React.ReactElement | null => {
  const is_logged_in = use_app_selector(select_is_logged_in);
  const search_params = use_search_params();
  const router = use_app_router();
  const show_onboarding =
    is_logged_in && search_params.get("onboarding") === "true";

  React.useEffect(() => {
    if (show_onboarding) {
      // Remove the `onboarding` search parameter.
      window.history.replaceState({}, "", "/");
    }
  }, [router, show_onboarding]);

  return show_onboarding ? <Onboarding /> : null;
};

const Page = (): React.ReactElement => {
  const is_logged_in = use_app_selector(select_is_logged_in);
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
      {is_logged_in && <PageHeader on_change={handle_change} value={value} />}
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
      <OnboardingItem />
    </>
  );
};

export default Page;
