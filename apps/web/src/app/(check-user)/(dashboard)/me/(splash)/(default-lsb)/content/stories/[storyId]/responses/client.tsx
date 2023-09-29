"use client";

import { clsx } from "clsx";
import dynamic from "next/dynamic";
import React from "react";

import { CommentListSkeleton, VirtualizedCommentList } from "~/common/comment";
import { dynamicLoader } from "~/common/dynamic";
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
import SearchIcon from "~/icons/Search";
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
  loading: dynamicLoader()
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
  onChange
}: {
  onChange: (newValue: StoryResponsesTabValue) => void;
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
    onValueChange={(newValue): void =>
      onChange(newValue as StoryResponsesTabValue)
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
  storyId,
  total_count,
  hidden_count
}: {
  tab: StoryResponsesTabValue;
} & StoryResponsesProps): React.ReactElement => {
  const dispatch = use_app_dispatch();
  const totalCount =
    use_app_selector((state) => state.entities.story_comment_counts[storyId]) ||
    0;
  const hiddenCount =
    use_app_selector(
      (state) => state.entities.story_hidden_comment_counts[storyId]
    ) || 0;
  const count_param = tab === "all" ? totalCount : hiddenCount;

  React.useEffect(() => {
    dispatch(number_action("story_comment_counts", storyId, total_count));
    dispatch(
      number_action("story_hidden_comment_counts", storyId, hidden_count)
    );
  }, [total_count, dispatch, hidden_count, storyId]);

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
  onSortChange,
  onQueryChange,
  disabled
}: {
  disabled?: boolean;
  onQueryChange: (newQuery: string) => void;
  onSortChange: (newSort: StoryResponsesSortValue) => void;
  query: string;
  sort: StoryResponsesSortValue;
  tab: StoryResponsesTabValue;
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
      placeholder={
        tab === "hidden" ? "Search hidden comments" : "Search comments"
      }
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
  const { storyId } = props;
  const [sort, setSort] = React.useState<StoryResponsesSortValue>("recent");
  const [query, setQuery] = React.useState<string>("");
  const [value, setValue] = React.useState<StoryResponsesTabValue>("all");
  const [page, set_page] = React.useState<number>(1);
  const debounced_query = use_debounce(query);
  const { data, isLoading, isFetching, isError, error, refetch } =
    use_get_story_comments_query({
      storyId,
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

  const handleChange = React.useCallback((newValue: StoryResponsesTabValue) => {
    set_page(1);
    setSort("recent");
    setQuery("");
    setValue(newValue);
  }, []);

  const handleSortChange = React.useCallback(
    (newSort: StoryResponsesSortValue) => {
      set_page(1);
      setSort(newSort);
    },
    []
  );

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
        <DashboardTitle
          back_button_href={"/me/content/stories"}
          hide_back_button={false}
        >
          Story responses
        </DashboardTitle>
        <PageHeader onChange={handleChange} value={value} />
        <StatusHeader {...props} tab={value} />
        <ControlBar
          disabled={!items.length}
          onQueryChange={handleQueryChange}
          onSortChange={handleSortChange}
          query={query}
          sort={sort}
          tab={value}
        />
        {isLoading || is_typing || (isFetching && page === 1) ? (
          <CommentListSkeleton />
        ) : isError ? (
          <ErrorState
            auto_size
            component_props={{
              button: { loading: isFetching }
            }}
            retry={refetch}
            type={get_query_error_type(error)}
          />
        ) : !isFetching && !items.length ? (
          <EmptyState query={query} value={value} />
        ) : (
          <VirtualizedCommentList
            commentProps={{
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
      <ContentStoryResponsesRightSidebar storyId={storyId} />
    </React.Fragment>
  );
};

export default ContentStoryResponsesClient;
