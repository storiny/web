"use client";

import { clsx } from "clsx";
import dynamic from "next/dynamic";
import React from "react";

import { CommentListSkeleton, VirtualizedCommentList } from "~/common/comment";
import { dynamicLoader } from "~/common/dynamic";
import { ReplyListSkeleton, VirtualizedReplyList } from "~/common/reply";
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
import SearchIcon from "~/icons/Search";
import {
  getQueryErrorType,
  setSelfCommentCount,
  setSelfReplyCount,
  useGetCommentsQuery,
  useGetRepliesQuery
} from "~/redux/features";
import { useAppDispatch, useAppSelector } from "~/redux/hooks";
import { abbreviateNumber } from "~/utils/abbreviateNumber";

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
  const dispatch = useAppDispatch();
  const commentCount =
    useAppSelector((state) => state.entities.selfCommentCount) || 0;
  const replyCount =
    useAppSelector((state) => state.entities.selfReplyCount) || 0;
  const count_param = tab === "comments" ? commentCount : replyCount;

  React.useEffect(() => {
    dispatch(setSelfCommentCount(() => comment_count));
    dispatch(setSelfReplyCount(() => reply_count));
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
            <span className={"t-bold"}>{abbreviateNumber(count_param)}</span>{" "}
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
      slotProps={{
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
      slotProps={{
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
  loadMore: () => void;
  page: number;
  query: string;
  sort: ResponsesSortValue;
}): React.ReactElement => {
  const { page, sort, query, handleQueryChange, handleSortChange, loadMore } =
    props;
  const debouncedQuery = useDebounce(query);
  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetCommentsQuery({
      page,
      sort,
      query: debouncedQuery
    });
  const { items = [], hasMore } = data || {};
  const isTyping = query !== debouncedQuery;

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
      {isLoading || isTyping ? <CommentListSkeleton isExtended /> : null}
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
        <EmptyState query={query} value={"comments"} />
      ) : (
        <VirtualizedCommentList
          commentProps={{
            isExtended: true
          }}
          comments={items}
          hasMore={Boolean(hasMore)}
          loadMore={loadMore}
          skeletonProps={{
            isExtended: true
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
  loadMore: () => void;
  page: number;
  query: string;
  sort: ResponsesSortValue;
}): React.ReactElement => {
  const { page, sort, query, handleSortChange, handleQueryChange, loadMore } =
    props;
  const debouncedQuery = useDebounce(query);
  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetRepliesQuery({
      page,
      sort,
      query: debouncedQuery
    } as { page: number; query: string; sort: "recent" | "old" | `likes-${"dsc" | "asc"}` });
  const { items = [], hasMore } = data || {};
  const isTyping = query !== debouncedQuery;

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
      {isLoading || isTyping ? <ReplyListSkeleton /> : null}
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
        <EmptyState query={query} value={"replies"} />
      ) : (
        <VirtualizedReplyList
          hasMore={Boolean(hasMore)}
          loadMore={loadMore}
          replies={items}
          replyProps={{
            isStatic: true
          }}
          skeletonProps={{
            isStatic: true
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
  const [page, setPage] = React.useState<number>(1);

  const loadMore = React.useCallback(
    () => setPage((prevState) => prevState + 1),
    []
  );

  const handleChange = React.useCallback((newValue: ResponsesTabValue) => {
    setPage(1);
    setSort("recent");
    setQuery("");
    setValue(newValue);
  }, []);

  const handleSortChange = React.useCallback(
    (newSort: ResponsesSortValue) => setSort(newSort),
    []
  );

  const handleQueryChange = React.useCallback(
    (newQuery: string) => setQuery(newQuery),
    []
  );

  return (
    <React.Fragment>
      <DashboardTitle>Responses</DashboardTitle>
      <PageHeader onChange={handleChange} value={value} />
      <StatusHeader {...props} tab={value} />
      {value === "comments" ? (
        <CommentList
          handleQueryChange={handleQueryChange}
          handleSortChange={handleSortChange}
          loadMore={loadMore}
          page={page}
          query={query}
          sort={sort}
        />
      ) : (
        <ReplyList
          handleQueryChange={handleQueryChange}
          handleSortChange={handleSortChange}
          loadMore={loadMore}
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
