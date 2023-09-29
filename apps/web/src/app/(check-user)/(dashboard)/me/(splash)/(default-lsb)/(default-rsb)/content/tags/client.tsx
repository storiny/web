"use client";

import { clsx } from "clsx";
import dynamic from "next/dynamic";
import React from "react";

import { dynamicLoader } from "~/common/dynamic";
import { TagListSkeleton, VirtualizedTagList } from "~/common/tag";
import Divider from "../../../../../../../../../../../../packages/ui/src/components/divider";
import Input from "../../../../../../../../../../../../packages/ui/src/components/input";
import Option from "../../../../../../../../../../../../packages/ui/src/components/option";
import Select from "../../../../../../../../../../../../packages/ui/src/components/select";
import Spacer from "../../../../../../../../../../../../packages/ui/src/components/spacer";
import Typography from "../../../../../../../../../../../../packages/ui/src/components/typography";
import ErrorState from "../../../../../../../../../../../../packages/ui/src/entities/error-state";
import { use_debounce } from "../../../../../../../../../../../../packages/ui/src/hooks/use-debounce";
import SearchIcon from "../../../../../../../../../../../../packages/ui/src/icons/search";
import {
  get_query_error_type,
  self_action,
  use_get_followed_tags_query
} from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import { abbreviate_number } from "../../../../../../../../../../../../packages/ui/src/utils/abbreviate-number";

import DashboardTitle from "../../../dashboard-title";
import styles from "./styles.module.scss";
import { TagsProps } from "./tags.props";

const EmptyState = dynamic(() => import("./empty-state"), {
  loading: dynamicLoader()
});

type SortOrder = "dsc" | "asc";

export type TagsSortValue = "recent" | "old" | `popular-${SortOrder}`;

// Status header

const StatusHeader = ({
  followed_tag_count
}: TagsProps): React.ReactElement => {
  const dispatch = use_app_dispatch();
  const followedTagCount =
    use_app_selector((state) => state.entities.self_followed_tag_count) || 0;

  React.useEffect(() => {
    dispatch(self_action("self_followed_tag_count", followed_tag_count));
  }, [dispatch, followed_tag_count]);

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
        {followedTagCount === 0 ? (
          "You have not followed any tags."
        ) : (
          <>
            You are following{" "}
            <span className={"t-bold"}>
              {abbreviate_number(followedTagCount)}
            </span>{" "}
            {followedTagCount === 1 ? "tag" : "tags"}.
          </>
        )}
      </Typography>
    </div>
  );
};

// Control bar

const ControlBar = ({
  query,
  sort,
  onSortChange,
  onQueryChange,
  disabled
}: {
  disabled?: boolean;
  onQueryChange: (newQuery: string) => void;
  onSortChange: (newSort: TagsSortValue) => void;
  query: string;
  sort: TagsSortValue;
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
      placeholder={"Search tags"}
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
      <Option value={"popular-dsc"}>Most popular</Option>
      <Option value={"popular-asc"}>Least popular</Option>
    </Select>
  </div>
);

const ContentTagsClient = (props: TagsProps): React.ReactElement => {
  const [sort, set_sort] = React.useState<TagsSortValue>("recent");
  const [query, setQuery] = React.useState<string>("");
  const [page, set_page] = React.useState<number>(1);
  const debounced_query = use_debounce(query);
  const { data, isLoading, is_fetching, isError, error, refetch } =
    use_get_followed_tags_query({
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

  const handleSortChange = React.useCallback((newSort: TagsSortValue) => {
    set_page(1);
    set_sort(newSort);
  }, []);

  const handleQueryChange = React.useCallback((newQuery: string) => {
    set_page(1);
    setQuery(newQuery);
  }, []);

  return (
    <React.Fragment>
      <DashboardTitle>Followed tags</DashboardTitle>
      <StatusHeader {...props} />
      <ControlBar
        disabled={!items.length}
        onQueryChange={handleQueryChange}
        onSortChange={handleSortChange}
        query={query}
        sort={sort}
      />
      {isLoading || is_typing || (is_fetching && page === 1) ? (
        <TagListSkeleton />
      ) : isError ? (
        <ErrorState
          auto_size
          component_props={{
            button: { loading: is_fetching }
          }}
          retry={refetch}
          type={get_query_error_type(error)}
        />
      ) : !is_fetching && !items.length ? (
        <EmptyState query={debounced_query} />
      ) : (
        <VirtualizedTagList
          has_more={Boolean(has_more)}
          load_more={load_more}
          tags={items}
        />
      )}
      <Spacer orientation={"vertical"} size={10} />
    </React.Fragment>
  );
};

export default ContentTagsClient;
