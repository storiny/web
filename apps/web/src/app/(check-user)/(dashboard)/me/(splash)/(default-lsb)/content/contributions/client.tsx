"use client";

import { clsx } from "clsx";
import dynamic from "next/dynamic";
import React from "react";

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
import { use_media_query } from "~/hooks/use-media-query";
import SearchIcon from "~/icons/search";
import {
  get_query_error_type,
  self_action,
  use_get_contributions_query
} from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import { BREAKPOINTS } from "~/theme/breakpoints";
import css from "~/theme/main.module.scss";
import { abbreviate_number } from "~/utils/abbreviate-number";

import DashboardTitle from "../../dashboard-title";
import { ContributionsProps } from "./contributions.props";
import ContentContributionsRightSidebar from "./right-sidebar";
import CollaborationRequests from "./right-sidebar/collaboration-requests";
import styles from "./styles.module.scss";

const EmptyState = dynamic(() => import("./empty-state"), {
  loading: dynamic_loader()
});

export type ContributionsSortValue = "recent" | "old";

// Sort control

const SortControl = ({
  sort,
  on_sort_change,
  disabled
}: {
  disabled?: boolean;
  on_sort_change: (next_sort: ContributionsSortValue) => void;
  sort: ContributionsSortValue;
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
  </Select>
);

// Status header

const StatusHeader = ({
  contributable_story_count: contributable_story_count_prop,
  pending_collaboration_request_count: pending_collaboration_request_count_prop
}: ContributionsProps): React.ReactElement => {
  const is_smaller_than_desktop = use_media_query(BREAKPOINTS.down("desktop"));
  const dispatch = use_app_dispatch();
  const contributable_story_count =
    use_app_selector(
      (state) => state.entities.self_contributable_story_count
    ) || 0;

  React.useEffect(() => {
    [
      self_action(
        "self_contributable_story_count",
        contributable_story_count_prop
      ),
      self_action(
        "self_pending_collaboration_request_count",
        pending_collaboration_request_count_prop
      )
    ].forEach(dispatch);
  }, [
    contributable_story_count_prop,
    dispatch,
    pending_collaboration_request_count_prop
  ]);

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
        {contributable_story_count === 0 ? (
          "There are no stories accepting your contributions."
        ) : (
          <>
            There {contributable_story_count === 1 ? "is" : "are"}{" "}
            <span className={css["t-bold"]}>
              {abbreviate_number(contributable_story_count)}
            </span>{" "}
            {contributable_story_count === 1 ? "story" : "stories"} accepting
            your contributions.
          </>
        )}
      </Typography>
      {is_smaller_than_desktop && <CollaborationRequests />}
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
  on_sort_change: (next_sort: ContributionsSortValue) => void;
  query: string;
  sort: ContributionsSortValue;
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
      placeholder={"Search your contributions"}
      size={"lg"}
      type={"search"}
      value={query}
    />
    <Divider orientation={"vertical"} />
    <SortControl
      disabled={disabled}
      on_sort_change={on_sort_change}
      sort={sort}
    />
  </div>
);

const ContentContributionsClient = (
  props: ContributionsProps
): React.ReactElement => {
  const { pending_collaboration_request_count } = props;
  const [sort, set_sort] = React.useState<ContributionsSortValue>("recent");
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
  } = use_get_contributions_query({
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

  const handle_sort_change = React.useCallback(
    (next_sort: ContributionsSortValue) => {
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
        <DashboardTitle>Contributions</DashboardTitle>
        <StatusHeader {...props} />
        <ControlBar
          disabled={!query && !items.length}
          on_query_change={handle_query_change}
          on_sort_change={handle_sort_change}
          query={query}
          sort={sort}
        />
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
          <EmptyState query={query} />
        ) : (
          <VirtualizedStoryList
            has_more={Boolean(has_more)}
            load_more={load_more}
            skeleton_props={{
              is_small: true
            }}
            stories={items}
            story_props={{ is_contributable: true }}
          />
        )}
        <Spacer orientation={"vertical"} size={10} />
      </main>
      <ContentContributionsRightSidebar
        pending_collaboration_request_count={
          pending_collaboration_request_count
        }
      />
    </React.Fragment>
  );
};

export default ContentContributionsClient;
