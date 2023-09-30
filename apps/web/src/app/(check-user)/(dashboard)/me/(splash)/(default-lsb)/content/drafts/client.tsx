"use client";

import { clsx } from "clsx";
import dynamic from "next/dynamic";
import NextLink from "next/link";
import React from "react";

import { dynamic_loader } from "~/common/dynamic";
import { StoryListSkeleton, VirtualizedStoryList } from "~/common/story";
import Button from "../../../../../../../../../../../packages/ui/src/components/button";
import Divider from "../../../../../../../../../../../packages/ui/src/components/divider";
import Input from "../../../../../../../../../../../packages/ui/src/components/input";
import Option from "../../../../../../../../../../../packages/ui/src/components/option";
import Select from "../../../../../../../../../../../packages/ui/src/components/select";
import Spacer from "../../../../../../../../../../../packages/ui/src/components/spacer";
import Tab from "../../../../../../../../../../../packages/ui/src/components/tab";
import Tabs from "../../../../../../../../../../../packages/ui/src/components/tabs";
import TabsList from "../../../../../../../../../../../packages/ui/src/components/tabs-list";
import Typography from "../../../../../../../../../../../packages/ui/src/components/typography";
import ErrorState from "../../../../../../../../../../../packages/ui/src/entities/error-state";
import { use_debounce } from "../../../../../../../../../../../packages/ui/src/hooks/use-debounce";
import PlusIcon from "../../../../../../../../../../../packages/ui/src/icons/plus";
import SearchIcon from "../../../../../../../../../../../packages/ui/src/icons/search";
import {
  get_query_error_type,
  self_action,
  use_get_drafts_query
} from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import { abbreviate_number } from "../../../../../../../../../../../packages/ui/src/utils/abbreviate-number";

import DashboardTitle from "../../dashboard-title";
import { DraftsProps } from "./drafts.props";
import ContentDraftsRightSidebar from "./right-sidebar";
import styles from "./styles.module.scss";

const EmptyState = dynamic(() => import("./empty-state"), {
  loading: dynamic_loader()
});

export type DraftsTabValue = "pending" | "deleted";
export type DraftsSortValue = "recent" | "old";

// Page header tabs

const PageHeader = ({
  value,
  on_change
}: {
  on_change: (next_value: DraftsTabValue) => void;
  value: DraftsTabValue;
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
    onValueChange={(next_value: DraftsTabValue): void => on_change(next_value)}
    value={value}
  >
    <TabsList className={clsx("full-w", styles.x, styles["tabs-list"])}>
      <Tab aria-controls={undefined} value={"pending"}>
        Pending
      </Tab>
      <Tab aria-controls={undefined} value={"deleted"}>
        Deleted
      </Tab>
    </TabsList>
  </Tabs>
);

// Sort control

const SortControl = ({
  sort,
  on_sort_change,
  disabled
}: {
  disabled?: boolean;
  on_sort_change: (next_sort: DraftsSortValue) => void;
  sort: DraftsSortValue;
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
  tab,
  pending_draft_count: pending_draft_count_prop,
  deleted_draft_count: deleted_draft_count_prop,
  disabled,
  on_sort_change,
  sort
}: {
  disabled?: boolean;
  on_sort_change: (next_sort: DraftsSortValue) => void;
  sort: DraftsSortValue;
  tab: DraftsTabValue;
} & Pick<
  DraftsProps,
  "pending_draft_count" | "deleted_draft_count"
>): React.ReactElement => {
  const dispatch = use_app_dispatch();
  const pending_draft_count =
    use_app_selector((state) => state.entities.self_pending_draft_count) || 0;
  const deleted_draft_count =
    use_app_selector((state) => state.entities.self_deleted_draft_count) || 0;
  const count_param =
    tab === "pending" ? pending_draft_count : deleted_draft_count;

  React.useEffect(() => {
    [
      self_action("self_pending_draft_count", pending_draft_count_prop),
      self_action("self_deleted_draft_count", deleted_draft_count_prop)
    ].forEach(dispatch);
  }, [deleted_draft_count_prop, dispatch, pending_draft_count_prop]);

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
          `You have no ${tab === "pending" ? "pending" : "deleted"} drafts.`
        ) : (
          <>
            You have{" "}
            <span className={"t-bold"}>{abbreviate_number(count_param)}</span>{" "}
            {tab === "pending" ? "pending" : "deleted"}{" "}
            {count_param === 1 ? "draft" : "drafts"}
          </>
        )}
      </Typography>
      <Spacer className={"f-grow"} size={2} />
      {tab === "pending" ? (
        <Button
          as={NextLink}
          check_auth
          className={clsx(styles.x, styles["header-button"])}
          decorator={<PlusIcon />}
          href={"/new"}
        >
          New draft
        </Button>
      ) : (
        <React.Fragment>
          <Divider orientation={"vertical"} />
          <SortControl
            disabled={disabled}
            on_sort_change={on_sort_change}
            sort={sort}
          />
        </React.Fragment>
      )}
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
  on_sort_change: (next_sort: DraftsSortValue) => void;
  query: string;
  sort: DraftsSortValue;
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
      placeholder={"Search your pending drafts"}
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

const ContentDraftsClient = (props: DraftsProps): React.ReactElement => {
  const { latest_draft, deleted_draft_count, pending_draft_count } = props;
  const [sort, set_sort] = React.useState<DraftsSortValue>("recent");
  const [query, set_query] = React.useState<string>("");
  const [value, set_value] = React.useState<DraftsTabValue>("pending");
  const [page, set_page] = React.useState<number>(1);
  const debounced_query = use_debounce(query);
  const {
    data,
    isLoading: is_loading,
    isFetching: is_fetching,
    isError: is_error,
    error,
    refetch
  } = use_get_drafts_query({
    page,
    sort,
    query: debounced_query,
    type: value
  });
  const { items = [], has_more } = data || {};
  const is_typing = query !== debounced_query;

  const load_more = React.useCallback(
    () => set_page((prev_state) => prev_state + 1),
    []
  );

  const handle_change = React.useCallback((next_value: DraftsTabValue) => {
    set_page(1);
    set_sort("recent");
    set_query("");
    set_value(next_value);
  }, []);

  const handle_sort_change = React.useCallback((next_sort: DraftsSortValue) => {
    set_page(1);
    set_sort(next_sort);
  }, []);

  const handle_query_change = React.useCallback((next_query: string) => {
    set_page(1);
    set_query(next_query);
  }, []);

  return (
    <React.Fragment>
      <main>
        <DashboardTitle>Drafts</DashboardTitle>
        <PageHeader on_change={handle_change} value={value} />
        <StatusHeader
          deleted_draft_count={deleted_draft_count}
          disabled={!items.length}
          on_sort_change={handle_sort_change}
          pending_draft_count={pending_draft_count}
          sort={sort}
          tab={value}
        />
        {value === "pending" && (
          <ControlBar
            disabled={!items.length}
            on_query_change={handle_query_change}
            on_sort_change={handle_sort_change}
            query={query}
            sort={sort}
          />
        )}
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
          <EmptyState query={query} value={value} />
        ) : (
          <VirtualizedStoryList
            has_more={Boolean(has_more)}
            load_more={load_more}
            skeleton_props={{
              is_small: true
            }}
            stories={items}
            story_props={{
              is_draft: true,
              is_deleted: value === "deleted"
            }}
          />
        )}
        <Spacer orientation={"vertical"} size={10} />
      </main>
      <ContentDraftsRightSidebar latest_draft={latest_draft} tab={value} />
    </React.Fragment>
  );
};

export default ContentDraftsClient;
