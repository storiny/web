"use client";

import { clsx } from "clsx";
import dynamic from "next/dynamic";
import React from "react";

import { CommentListSkeleton, VirtualizedCommentList } from "~/common/comment";
import { dynamicLoader } from "~/common/dynamic";
import { ReplyListSkeleton, VirtualizedReplyList } from "~/common/reply";
import Divider from "../../../../../../../../../../../../packages/ui/src/components/divider";
import Input from "../../../../../../../../../../../../packages/ui/src/components/input";
import Option from "../../../../../../../../../../../../packages/ui/src/components/option";
import Select from "../../../../../../../../../../../../packages/ui/src/components/select";
import Spacer from "../../../../../../../../../../../../packages/ui/src/components/spacer";
import Tab from "../../../../../../../../../../../../packages/ui/src/components/tab";
import Tabs from "../../../../../../../../../../../../packages/ui/src/components/tabs";
import TabsList from "../../../../../../../../../../../../packages/ui/src/components/tabs-list";
import Typography from "../../../../../../../../../../../../packages/ui/src/components/typography";
import ErrorState from "../../../../../../../../../../../../packages/ui/src/entities/error-state";
import { use_debounce } from "../../../../../../../../../../../../packages/ui/src/hooks/use-debounce";
import SearchIcon from "~/icons/Search";
import {
  get_query_error_type,
  self_action,
  use_get_comments_query,
  use_get_replies_query
} from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import { abbreviate_number } from "../../../../../../../../../../../../packages/ui/src/utils/abbreviate-number";

import DashboardTitle from "../../../dashboard-title";
import { ResponsesProps } from "./responses.props";
import styles from "./styles.module.scss";

const EmptyState = dynamic(() => import("./empty-state"), {
  loading: dynamicLoader()
});

type SortOrder = "dsc" | "asc";

export type ResponsesTabValue = "comments" | "replies";
export type ResponsesSortValue =
  | "recent"
  | "old"
  | `replies-${SortOrder}`
  | `likes-${SortOrder}`;

// Page header tabs

const PageHeader = ({
  value,
  onChange
}: {
  onChange: (newValue: ResponsesTabValue) => void;
  value: ResponsesTabValue;
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
    onValueChange={(newValue): void => onChange(newValue as ResponsesTabValue)}
    value={value}
  >
    <TabsList className={clsx("full-w", styles.x, styles["tabs-list"])}>
      <Tab aria-controls={undefined} value={"comments"}>
        Comments
      </Tab>
      <Tab aria-controls={undefined} value={"replies"}>
        Replies
      </Tab>
    </TabsList>
  </Tabs>
);

// Status header

const StatusHeader = ({
  tab,
  comment_count,
  reply_count
}: {
  tab: ResponsesTabValue;
} & ResponsesProps): React.ReactElement => {
  const dispatch = use_app_dispatch();
  const commentCount =
    use_app_selector((state) => state.entities.self_comment_count) || 0;
  const replyCount =
    use_app_selector((state) => state.entities.self_reply_count) || 0;
  const count_param = tab === "comments" ? commentCount : replyCount;

  React.useEffect(() => {
    [
      self_action("self_comment_count", comment_count),
      self_action("self_reply_count", reply_count)
    ].forEach(disaptch);
  }, [comment_count, dispatch, reply_count]);

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
          tab === "comments" ? (
            "You have not commented on any story yet."
          ) : (
            "You have not replied to any comment yet."
          )
        ) : (
          <>
            You have posted{" "}
            <span className={"t-bold"}>{abbreviate_number(count_param)}</span>{" "}
            {count_param === 1
              ? tab === "comments"
                ? "comment"
                : "reply"
              : tab}
          </>
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
  onSortChange: (newSort: ResponsesSortValue) => void;
  query: string;
  sort: ResponsesSortValue;
  tab: ResponsesTabValue;
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
      placeholder={`Search your ${tab}`}
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
      {tab !== "replies" && (
        <React.Fragment>
          <Option value={"replies-dsc"}>Most replied</Option>
          <Option value={"replies-asc"}>Least replied</Option>
        </React.Fragment>
      )}
    </Select>
  </div>
);

// Comment list

const CommentList = (props: {
  handleQueryChange: (newValue: string) => void;
  handleSortChange: (newValue: ResponsesSortValue) => void;
  load_more: () => void;
  page: number;
  query: string;
  sort: ResponsesSortValue;
}): React.ReactElement => {
  const { page, sort, query, handleQueryChange, handleSortChange, load_more } =
    props;
  const debounced_query = use_debounce(query);
  const { data, isLoading, isFetching, isError, error, refetch } =
    use_get_comments_query({
      page,
      sort,
      query: debounced_query
    });
  const { items = [], has_more } = data || {};
  const is_typing = query !== debounced_query;

  return (
    <React.Fragment>
      <ControlBar
        disabled={!items.length}
        onQueryChange={handleQueryChange}
        onSortChange={handleSortChange}
        query={query}
        sort={sort}
        tab={"comments"}
      />
      {isLoading || is_typing || (isFetching && page === 1) ? (
        <CommentListSkeleton is_extended />
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
        <EmptyState query={query} value={"comments"} />
      ) : (
        <VirtualizedCommentList
          commentProps={{
            is_extended: true
          }}
          comments={items}
          has_more={Boolean(has_more)}
          load_more={load_more}
          skeletonProps={{
            is_extended: true
          }}
        />
      )}
    </React.Fragment>
  );
};

// Reply list

const ReplyList = (props: {
  handleQueryChange: (newValue: string) => void;
  handleSortChange: (newValue: ResponsesSortValue) => void;
  load_more: () => void;
  page: number;
  query: string;
  sort: ResponsesSortValue;
}): React.ReactElement => {
  const { page, sort, query, handleSortChange, handleQueryChange, load_more } =
    props;
  const debounced_query = use_debounce(query);
  const { data, isLoading, isFetching, isError, error, refetch } =
    use_get_replies_query({
      page,
      sort,
      query: debounced_query
    } as { page: number; query: string; sort: "recent" | "old" | `likes-${"dsc" | "asc"}` });
  const { items = [], has_more } = data || {};
  const is_typing = query !== debounced_query;

  return (
    <React.Fragment>
      <ControlBar
        disabled={!items.length}
        onQueryChange={handleQueryChange}
        onSortChange={handleSortChange}
        query={query}
        sort={sort}
        tab={"replies"}
      />
      {isLoading || is_typing || (isFetching && page === 1) ? (
        <ReplyListSkeleton />
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
        <EmptyState query={query} value={"replies"} />
      ) : (
        <VirtualizedReplyList
          has_more={Boolean(has_more)}
          load_more={load_more}
          replies={items}
          replyProps={{
            is_static: true
          }}
          skeletonProps={{
            is_static: true
          }}
        />
      )}
    </React.Fragment>
  );
};

const ContentResponsesClient = (props: ResponsesProps): React.ReactElement => {
  const [sort, setSort] = React.useState<ResponsesSortValue>("recent");
  const [query, setQuery] = React.useState<string>("");
  const [value, setValue] = React.useState<ResponsesTabValue>("comments");
  const [page, set_page] = React.useState<number>(1);

  const load_more = React.useCallback(
    () => set_page((prev_state) => prev_state + 1),
    []
  );

  const handleChange = React.useCallback((newValue: ResponsesTabValue) => {
    set_page(1);
    setSort("recent");
    setQuery("");
    setValue(newValue);
  }, []);

  const handleSortChange = React.useCallback((newSort: ResponsesSortValue) => {
    set_page(1);
    setSort(newSort);
  }, []);

  const handleQueryChange = React.useCallback((newQuery: string) => {
    set_page(1);
    setQuery(newQuery);
  }, []);

  return (
    <React.Fragment>
      <DashboardTitle>Responses</DashboardTitle>
      <PageHeader onChange={handleChange} value={value} />
      <StatusHeader {...props} tab={value} />
      {value === "comments" ? (
        <CommentList
          handleQueryChange={handleQueryChange}
          handleSortChange={handleSortChange}
          load_more={load_more}
          page={page}
          query={query}
          sort={sort}
        />
      ) : (
        <ReplyList
          handleQueryChange={handleQueryChange}
          handleSortChange={handleSortChange}
          load_more={load_more}
          page={page}
          query={query}
          sort={sort}
        />
      )}
      <Spacer orientation={"vertical"} size={10} />
    </React.Fragment>
  );
};

export default ContentResponsesClient;
