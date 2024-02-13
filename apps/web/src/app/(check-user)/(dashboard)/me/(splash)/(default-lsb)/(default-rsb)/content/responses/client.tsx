"use client";

import { clsx } from "clsx";
import dynamic from "next/dynamic";
import {
  usePathname as use_pathname,
  useSearchParams as use_search_params
} from "next/navigation";
import React from "react";

import { CommentListSkeleton, VirtualizedCommentList } from "~/common/comment";
import { dynamic_loader } from "~/common/dynamic";
import { ReplyListSkeleton, VirtualizedReplyList } from "~/common/reply";
import { use_app_router } from "~/common/utils";
import Divider from "~/components/divider";
import Input from "~/components/input";
import Option from "~/components/option";
import Select from "~/components/select";
import Spacer from "~/components/spacer";
import Tab from "~/components/tab";
import Tabs from "~/components/tabs";
import TabsList from "~/components/tabs-list";
import Typography from "~/components/typography";
import ErrorState from "~/entities/error-state";
import { use_debounce } from "~/hooks/use-debounce";
import SearchIcon from "~/icons/search";
import {
  get_query_error_type,
  self_action,
  use_get_comments_query,
  use_get_replies_query
} from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import css from "~/theme/main.module.scss";
import { abbreviate_number } from "~/utils/abbreviate-number";

import DashboardTitle from "../../../dashboard-title";
import { ResponsesProps } from "./responses.props";
import styles from "./styles.module.scss";

const EmptyState = dynamic(() => import("./empty-state"), {
  loading: dynamic_loader()
});

type SortOrder = "least" | "most";

export type ResponsesTabValue = "comments" | "replies";
export type ResponsesSortValue =
  | "recent"
  | "old"
  | `${SortOrder}-replied`
  | `${SortOrder}-liked`;

// Page header tabs

const PageHeader = ({
  value,
  on_change
}: {
  on_change: (next_value: ResponsesTabValue) => void;
  value: ResponsesTabValue;
}): React.ReactElement => (
  <Tabs
    className={clsx(
      css["full-bleed"],
      css["page-header"],
      css["dashboard-header"],
      css["with-page-title"],
      styles.x,
      styles.tabs
    )}
    onValueChange={(next_value): void =>
      on_change(next_value as ResponsesTabValue)
    }
    value={value}
  >
    <TabsList className={clsx(css["full-w"], styles.x, styles["tabs-list"])}>
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
  comment_count: comment_count_prop,
  reply_count: reply_count_prop
}: {
  tab: ResponsesTabValue;
} & ResponsesProps): React.ReactElement => {
  const dispatch = use_app_dispatch();
  const comment_count =
    use_app_selector((state) => state.entities.self_comment_count) || 0;
  const reply_count =
    use_app_selector((state) => state.entities.self_reply_count) || 0;
  const count_param = tab === "comments" ? comment_count : reply_count;

  React.useEffect(() => {
    [
      self_action("self_comment_count", comment_count_prop),
      self_action("self_reply_count", reply_count_prop)
    ].forEach(dispatch);
  }, [comment_count_prop, dispatch, reply_count_prop]);

  return (
    <div
      className={clsx(
        css["full-bleed"],
        css["dashboard-header"],
        css["flex-center"],
        styles["status-header"]
      )}
      style={{ alignItems: "flex-start" }}
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
            <span className={css["t-bold"]}>
              {abbreviate_number(count_param)}
            </span>{" "}
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
  on_sort_change,
  on_query_change,
  disabled
}: {
  disabled?: boolean;
  on_query_change: (next_query: string) => void;
  on_sort_change: (next_sort: ResponsesSortValue) => void;
  query: string;
  sort: ResponsesSortValue;
  tab: ResponsesTabValue;
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
      placeholder={`Search your ${tab}`}
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
      <Option value={"most-liked"}>Most liked</Option>
      <Option value={"least-liked"}>Least liked</Option>
      {tab !== "replies" && (
        <React.Fragment>
          <Option value={"most-replied"}>Most replied</Option>
          <Option value={"least-replied"}>Least replied</Option>
        </React.Fragment>
      )}
    </Select>
  </div>
);

// Comment list

const CommentList = (props: {
  handle_query_change: (next_value: string) => void;
  handle_sort_change: (next_value: ResponsesSortValue) => void;
  load_more: () => void;
  page: number;
  query: string;
  sort: ResponsesSortValue;
}): React.ReactElement => {
  const {
    page,
    sort,
    query,
    handle_query_change,
    handle_sort_change,
    load_more
  } = props;
  const debounced_query = use_debounce(query);
  const {
    data,
    isLoading: is_loading,
    isFetching: is_fetching,
    isError: is_error,
    error,
    refetch
  } = use_get_comments_query({
    page,
    sort,
    query: debounced_query
  });
  const { items = [], has_more } = data || {};
  const is_typing = query !== debounced_query;

  return (
    <React.Fragment>
      <ControlBar
        disabled={!query && !items.length}
        on_query_change={handle_query_change}
        on_sort_change={handle_sort_change}
        query={query}
        sort={sort}
        tab={"comments"}
      />
      {is_loading || is_typing || (is_fetching && page === 1) ? (
        <CommentListSkeleton is_extended />
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
        <EmptyState query={query} value={"comments"} />
      ) : (
        <VirtualizedCommentList
          comment_props={{
            is_extended: true
          }}
          comments={items}
          has_more={Boolean(has_more)}
          load_more={load_more}
          skeleton_props={{
            is_extended: true
          }}
        />
      )}
    </React.Fragment>
  );
};

// Reply list

const ReplyList = (props: {
  handle_query_change: (next_value: string) => void;
  handle_sort_change: (next_value: ResponsesSortValue) => void;
  load_more: () => void;
  page: number;
  query: string;
  sort: ResponsesSortValue;
}): React.ReactElement => {
  const {
    page,
    sort,
    query,
    handle_sort_change,
    handle_query_change,
    load_more
  } = props;
  const debounced_query = use_debounce(query);
  const {
    data,
    isLoading: is_loading,
    isFetching: is_fetching,
    isError: is_error,
    error,
    refetch
  } = use_get_replies_query({
    page,
    sort,
    query: debounced_query
  } as {
    page: number;
    query: string;
    sort: "recent" | "old" | `${"least" | "most"}-liked`;
  });
  const { items = [], has_more } = data || {};
  const is_typing = query !== debounced_query;

  return (
    <React.Fragment>
      <ControlBar
        disabled={!query && !items.length}
        on_query_change={handle_query_change}
        on_sort_change={handle_sort_change}
        query={query}
        sort={sort}
        tab={"replies"}
      />
      {is_loading || is_typing || (is_fetching && page === 1) ? (
        <ReplyListSkeleton />
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
        <EmptyState query={query} value={"replies"} />
      ) : (
        <VirtualizedReplyList
          has_more={Boolean(has_more)}
          load_more={load_more}
          replies={items}
          reply_props={{
            is_static: true
          }}
          skeleton_props={{
            is_static: true
          }}
        />
      )}
    </React.Fragment>
  );
};

const ContentResponsesClient = (props: ResponsesProps): React.ReactElement => {
  const router = use_app_router();
  const pathname = use_pathname();
  const search_params = use_search_params();
  const tab = search_params.get("tab") || "comments";
  const [sort, set_sort] = React.useState<ResponsesSortValue>("recent");
  const [query, set_query] = React.useState<string>("");
  const [value, set_value] = React.useState<ResponsesTabValue>(
    (["comments", "replies"] as ResponsesTabValue[]).includes(
      tab as ResponsesTabValue
    )
      ? (tab as ResponsesTabValue)
      : "comments"
  );
  const [page, set_page] = React.useState<number>(1);

  const load_more = React.useCallback(
    () => set_page((prev_state) => prev_state + 1),
    []
  );

  const handle_change = React.useCallback((next_value: ResponsesTabValue) => {
    set_page(1);
    set_sort("recent");
    set_query("");
    set_value(next_value);
  }, []);

  const handle_sort_change = React.useCallback(
    (next_sort: ResponsesSortValue) => {
      set_page(1);
      set_sort(next_sort);
    },
    []
  );

  const handle_query_change = React.useCallback((next_query: string) => {
    set_page(1);
    set_query(next_query);
  }, []);

  React.useEffect(() => {
    if (value === "comments") {
      router.push(pathname);
    } else {
      router.push(`${pathname}?tab=${value}`);
    }
  }, [pathname, router, value]);

  return (
    <React.Fragment>
      <DashboardTitle>Responses</DashboardTitle>
      <PageHeader on_change={handle_change} value={value} />
      <StatusHeader {...props} tab={value} />
      {value === "comments" ? (
        <CommentList
          handle_query_change={handle_query_change}
          handle_sort_change={handle_sort_change}
          load_more={load_more}
          page={page}
          query={query}
          sort={sort}
        />
      ) : (
        <ReplyList
          handle_query_change={handle_query_change}
          handle_sort_change={handle_sort_change}
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
