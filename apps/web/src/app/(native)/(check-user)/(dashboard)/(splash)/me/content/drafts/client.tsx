"use client";

import { clsx } from "clsx";
import dynamic from "next/dynamic";
import NextLink from "next/link";
import {
  usePathname as use_pathname,
  useSearchParams as use_search_params
} from "next/navigation";
import React from "react";

import { dynamic_loader } from "~/common/dynamic";
import { StoryListSkeleton, VirtualizedStoryList } from "~/common/story";
import { use_app_router } from "~/common/utils";
import Button from "~/components/button";
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
import { use_handle_dynamic_state } from "~/hooks/use-handle-dynamic-state";
import PlusIcon from "~/icons/plus";
import SearchIcon from "~/icons/search";
import {
  get_query_error_type,
  self_action,
  use_get_drafts_query
} from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import css from "~/theme/main.module.scss";
import { abbreviate_number } from "~/utils/abbreviate-number";

import DashboardTitle from "../../../common/dashboard-title";
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
      css["full-bleed"],
      css["page-header"],
      css["dashboard-header"],
      css["with-page-title"],
      styles.x,
      styles.tabs
    )}
    onValueChange={(next_value): void =>
      on_change(next_value as DraftsTabValue)
    }
    value={value}
  >
    <TabsList className={clsx(css["full-w"], styles.x, styles["tabs-list"])}>
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
        css["full-bleed"],
        css["dashboard-header"],
        css["flex-center"],
        styles["status-header"]
      )}
      style={{ justifyContent: "flex-start" }}
    >
      <Typography ellipsis level={"body2"} style={{ width: "100%" }}>
        {count_param === 0 ? (
          `You have no ${tab === "pending" ? "pending" : "deleted"} drafts.`
        ) : (
          <>
            You have{" "}
            <span className={css["t-bold"]}>
              {abbreviate_number(count_param)}
            </span>{" "}
            {tab === "pending" ? "pending" : "deleted"}{" "}
            {count_param === 1 ? "draft" : "drafts"}
          </>
        )}
      </Typography>
      <Spacer className={css["f-grow"]} size={2} />
      {tab === "pending" ? (
        <Button
          as={NextLink}
          check_auth
          className={clsx(styles.x, styles["header-button"])}
          decorator={<PlusIcon />}
          href={"/new"}
          variant={"ghost"}
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
  const router = use_app_router();
  const pathname = use_pathname();
  const search_params = use_search_params();
  const tab = search_params.get("tab") || "pending";
  const [sort, set_sort] = React.useState<DraftsSortValue>("recent");
  const [query, set_query] = React.useState<string>("");
  const [value, set_value] = React.useState<DraftsTabValue>(
    (["pending", "deleted"] as DraftsTabValue[]).includes(tab as DraftsTabValue)
      ? (tab as DraftsTabValue)
      : "pending"
  );
  const [page, set_page] = React.useState<number>(1);
  use_handle_dynamic_state(1, set_page);
  use_handle_dynamic_state("", set_query);
  use_handle_dynamic_state("recent", set_sort);
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

  React.useEffect(() => {
    if (value === "pending") {
      router.push(pathname);
    } else {
      router.push(`${pathname}?tab=${value}`);
    }
  }, [pathname, router, value]);

  return (
    <React.Fragment>
      <main data-root={"true"}>
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
            disabled={!query && !items.length}
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
