"use client";

import { clsx } from "clsx";
import dynamic from "next/dynamic";
import React from "react";

import { use_blog_context } from "~/common/context/blog";
import { dynamic_loader } from "~/common/dynamic";
import { StoryListSkeleton, VirtualizedStoryList } from "~/common/story";
import { use_confirmation } from "~/components/confirmation";
import Divider from "~/components/divider";
import Input from "~/components/input";
import MenuItem from "~/components/menu-item";
import Option from "~/components/option";
import Select from "~/components/select";
import Spacer from "~/components/spacer";
import { use_toast } from "~/components/toast";
import Typography from "~/components/typography";
import ErrorState from "~/entities/error-state";
import { use_debounce } from "~/hooks/use-debounce";
import { use_handle_dynamic_state } from "~/hooks/use-handle-dynamic-state";
import SearchIcon from "~/icons/search";
import TrashIcon from "~/icons/trash";
import {
  get_blog_pending_stories_api,
  get_query_error_type,
  number_action,
  use_get_blog_pending_stories_query,
  use_remove_blog_story_mutation
} from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import css from "~/theme/main.module.scss";
import { abbreviate_number } from "~/utils/abbreviate-number";
import { handle_api_error } from "~/utils/handle-api-error";

import DashboardTitle from "../../../../../common/dashboard-title";
import { PendingStoriesProps } from "./pending-stories.props";
import styles from "./styles.module.scss";

const EmptyState = dynamic(() => import("./empty-state"), {
  loading: dynamic_loader()
});

export type PendingStoriesSortValue = "recent" | "old";

// Status header

const StatusHeader = ({
  pending_story_count: pending_story_count_prop
}: PendingStoriesProps): React.ReactElement => {
  const blog = use_blog_context();
  const dispatch = use_app_dispatch();
  const pending_story_count =
    use_app_selector(
      (state) => state.entities.blog_pending_story_counts[blog.id]
    ) || 0;

  React.useEffect(() => {
    dispatch(
      number_action(
        "blog_pending_story_counts",
        blog.id,
        pending_story_count_prop
      )
    );
  }, [pending_story_count_prop, dispatch, blog.id]);

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
        {pending_story_count === 0 ? (
          "There are no pending stories."
        ) : (
          <>
            There {pending_story_count === 1 ? "is" : "are"}{" "}
            <span className={css["t-bold"]}>
              {abbreviate_number(pending_story_count)}
            </span>{" "}
            pending {pending_story_count === 1 ? "story" : "stories"}.
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
  on_sort_change,
  on_query_change,
  disabled
}: {
  disabled?: boolean;
  on_query_change: (next_query: string) => void;
  on_sort_change: (next_sort: PendingStoriesSortValue) => void;
  query: string;
  sort: PendingStoriesSortValue;
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
      placeholder={"Search pending stories"}
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
    </Select>
  </div>
);

// Remove action

const RemoveStoryAction = ({
  story_id
}: {
  story_id: string;
}): React.ReactElement => {
  const blog = use_blog_context();
  const toast = use_toast();
  const dispatch = use_app_dispatch();
  const [remove_blog_story, { isLoading: is_loading }] =
    use_remove_blog_story_mutation();

  /**
   * Removes the story from the blog
   */
  const handle_remove = (): void => {
    remove_blog_story({ blog_id: blog.id, story_id, type: "pending" })
      .unwrap()
      .then(() => {
        toast("Story removed", "success");
        dispatch(get_blog_pending_stories_api.util.resetApiState());
      })
      .catch((error) =>
        handle_api_error(error, toast, null, "Could not remove the story")
      );
  };

  const [element] = use_confirmation(
    ({ open_confirmation }) => (
      <MenuItem
        check_auth
        decorator={<TrashIcon />}
        disabled={is_loading}
        onSelect={(event): void => {
          event.preventDefault(); // Do not auto-close the menu
          event.stopPropagation();
          open_confirmation();
        }}
      >
        Remove this story
      </MenuItem>
    ),
    {
      color: "ruby",
      on_confirm: handle_remove,
      title: "Remove this story?",
      decorator: <TrashIcon />,
      description: "This story will be removed from the blog immediately."
    }
  );

  return element;
};

const ContentPendingStoriesClient = (
  props: PendingStoriesProps
): React.ReactElement => {
  const blog = use_blog_context();
  const [sort, set_sort] = React.useState<PendingStoriesSortValue>("recent");
  const [query, set_query] = React.useState<string>("");
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
  } = use_get_blog_pending_stories_query({
    page,
    sort,
    query: debounced_query,
    blog_id: blog.id
  });
  const { items = [], has_more } = data || {};
  const is_typing = query !== debounced_query;

  const load_more = React.useCallback(
    () => set_page((prev_state) => prev_state + 1),
    []
  );

  const handle_sort_change = React.useCallback(
    (next_sort: PendingStoriesSortValue) => {
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
      <DashboardTitle>Pending stories</DashboardTitle>
      <StatusHeader {...props} />
      <ControlBar
        disabled={!query && !items.length}
        on_query_change={handle_query_change}
        on_sort_change={handle_sort_change}
        query={query}
        sort={sort}
      />
      {is_loading || is_typing || (is_fetching && page === 1) ? (
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
        <EmptyState query={query} />
      ) : (
        <VirtualizedStoryList
          has_more={Boolean(has_more)}
          load_more={load_more}
          stories={items}
          story_props={{
            is_blog: true,
            custom_action: (story) => <RemoveStoryAction story_id={story.id} />
          }}
        />
      )}
      <Spacer orientation={"vertical"} size={10} />
    </React.Fragment>
  );
};

export default ContentPendingStoriesClient;
