"use client";

import { clsx } from "clsx";
import dynamic from "next/dynamic";
import React from "react";

import { CommentListSkeleton, VirtualizedCommentList } from "~/common/comment";
import { dynamic_loader } from "~/common/dynamic";
import Divider from "../../../../../../../../../../../../../packages/ui/src/components/divider";
import Input from "../../../../../../../../../../../../../packages/ui/src/components/input";
import Option from "../../../../../../../../../../../../../packages/ui/src/components/option";
import Select from "../../../../../../../../../../../../../packages/ui/src/components/select";
import Spacer from "../../../../../../../../../../../../../packages/ui/src/components/spacer";
import Tab from "../../../../../../../../../../../../../packages/ui/src/components/tab";
import Tabs from "../../../../../../../../../../../../../packages/ui/src/components/tabs";
import TabsList from "../../../../../../../../../../../../../packages/ui/src/components/tabs-list";
import Typography from "../../../../../../../../../../../../../packages/ui/src/components/typography";
import ErrorState from "../../../../../../../../../../../../../packages/ui/src/entities/error-state";
import { use_debounce } from "../../../../../../../../../../../../../packages/ui/src/hooks/use-debounce";
import SearchIcon from "../../../../../../../../../../../../../packages/ui/src/icons/search";
import {
  get_query_error_type,
  number_action,
  use_get_story_comments_query
} from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import { abbreviate_number } from "../../../../../../../../../../../../../packages/ui/src/utils/abbreviate-number";

import DashboardTitle from "../../../../dashboard-title";
import { StoryResponsesProps } from "./responses.props";
import ContentStoryResponsesRightSidebar from "./right-sidebar";
import styles from "./styles.module.scss";

const EmptyState = dynamic(() => import("./empty-state"), {
  loading: dynamic_loader()
});

type SortOrder = "dsc" | "asc";

export type StoryResponsesTabValue = "all" | "hidden";
export type StoryResponsesSortValue =
  | "recent"
  | "old"
  | `replies-${SortOrder}`
  | `likes-${SortOrder}`;

// Page header tabs

const PageHeader = ({
  value,
  on_change
}: {
  on_change: (next_value: StoryResponsesTabValue) => void;
  value: StoryResponsesTabValue;
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
    onValueChange={(next_value: StoryResponsesTabValue): void =>
      on_change(next_value)
    }
    value={value}
  >
    <TabsList className={clsx("full-w", styles.x, styles["tabs-list"])}>
      <Tab aria-controls={undefined} value={"all"}>
        All
      </Tab>
      <Tab aria-controls={undefined} value={"hidden"}>
        Hidden
      </Tab>
    </TabsList>
  </Tabs>
);

// Status header

const StatusHeader = ({
  tab,
  story_id,
  total_count: total_count_prop,
  hidden_count: hidden_count_prop
}: {
  tab: StoryResponsesTabValue;
} & StoryResponsesProps): React.ReactElement => {
  const dispatch = use_app_dispatch();
  const total_count =
    use_app_selector(
      (state) => state.entities.story_comment_counts[story_id]
    ) || 0;
  const hidden_count =
    use_app_selector(
      (state) => state.entities.story_hidden_comment_counts[story_id]
    ) || 0;
  const count_param = tab === "all" ? total_count : hidden_count;

  React.useEffect(() => {
    dispatch(number_action("story_comment_counts", story_id, total_count_prop));
    dispatch(
      number_action("story_hidden_comment_counts", story_id, hidden_count_prop)
    );
  }, [total_count_prop, dispatch, hidden_count_prop, story_id]);

  return (
    <div
      className={clsx(
        "full-bleed",
        "dashboard-header",
        "flex-center",
        styles["status-header"]
      )}
    >
      <Typography ellipsis level={"body2"}>
        {count_param === 0 ? (
          tab === "all" ? (
            "Your story does not have any comments yet."
          ) : (
            "You have not hidden any comments on this story."
          )
        ) : tab === "all" ? (
          <React.Fragment>
            Your story has a total of{" "}
            <span className={"t-bold"}>{abbreviate_number(count_param)}</span>{" "}
            {count_param === 1 ? "comment" : "comments"}.
          </React.Fragment>
        ) : (
          <React.Fragment>
            You have hidden{" "}
            <span className={"t-bold"}>{abbreviate_number(count_param)}</span>{" "}
            {count_param === 1 ? "comment" : "comments"} on this story.
          </React.Fragment>
        )}
      </Typography>
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
  on_sort_change: (next_sort: StoryResponsesSortValue) => void;
  query: string;
  sort: StoryResponsesSortValue;
  tab: StoryResponsesTabValue;
}): React.ReactElement => (
  <div
    className={clsx(
      "flex-center",
      "full-bleed",
      "dashboard-header",
      styles["control-bar"]
    )}
  >
    <Input
      decorator={<SearchIcon />}
      disabled={disabled}
      onChange={(event): void => on_query_change(event.target.value)}
      placeholder={
        tab === "hidden" ? "Search hidden comments" : "Search comments"
      }
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
      <Option value={"likes-dsc"}>Most liked</Option>
      <Option value={"likes-asc"}>Least liked</Option>
      <Option value={"replies-dsc"}>Most replied</Option>
      <Option value={"replies-asc"}>Least replied</Option>
    </Select>
  </div>
);

const ContentStoryResponsesClient = (
  props: StoryResponsesProps
): React.ReactElement => {
  const { story_id } = props;
  const [sort, set_sort] = React.useState<StoryResponsesSortValue>("recent");
  const [query, set_query] = React.useState<string>("");
  const [value, set_value] = React.useState<StoryResponsesTabValue>("all");
  const [page, set_page] = React.useState<number>(1);
  const debounced_query = use_debounce(query);
  const {
    data,
    isLoading: is_loading,
    isFetching: is_fetching,
    isError: is_error,
    error,
    refetch
  } = use_get_story_comments_query({
    story_id,
    page,
    sort,
    type: value,
    query: debounced_query
  });
  const { items = [], has_more } = data || {};
  const is_typing = query !== debounced_query;

  const load_more = React.useCallback(
    () => set_page((prev_state) => prev_state + 1),
    []
  );

  const handle_change = React.useCallback(
    (next_value: StoryResponsesTabValue) => {
      set_page(1);
      set_sort("recent");
      set_query("");
      set_value(next_value);
    },
    []
  );

  const handle_sort_change = React.useCallback(
    (next_sort: StoryResponsesSortValue) => {
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
      <main>
        <DashboardTitle
          back_button_href={"/me/content/stories"}
          hide_back_button={false}
        >
          Story responses
        </DashboardTitle>
        <PageHeader on_change={handle_change} value={value} />
        <StatusHeader {...props} tab={value} />
        <ControlBar
          disabled={!items.length}
          on_query_change={handle_query_change}
          on_sort_change={handle_sort_change}
          query={query}
          sort={sort}
          tab={value}
        />
        {is_loading || is_typing || (is_fetching && page === 1) ? (
          <CommentListSkeleton />
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
          <VirtualizedCommentList
            comment_props={{
              is_static: true,
              hide_hidden_overlay: true
            }}
            comments={items}
            has_more={Boolean(has_more)}
            load_more={load_more}
          />
        )}
        <Spacer orientation={"vertical"} size={10} />
      </main>
      <ContentStoryResponsesRightSidebar story_id={story_id} />
    </React.Fragment>
  );
};

export default ContentStoryResponsesClient;
