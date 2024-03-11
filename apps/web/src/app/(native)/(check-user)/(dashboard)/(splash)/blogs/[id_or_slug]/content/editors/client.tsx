"use client";

import { clsx } from "clsx";
import dynamic from "next/dynamic";
import React from "react";

import { use_blog_context } from "~/common/context/blog";
import { dynamic_loader } from "~/common/dynamic";
import { UserListSkeleton, VirtualizedUserList } from "~/common/user";
import Button from "~/components/button";
import { use_confirmation } from "~/components/confirmation";
import MenuItem from "~/components/menu-item";
import Spacer from "~/components/spacer";
import { use_toast } from "~/components/toast";
import Typography from "~/components/typography";
import ErrorState from "~/entities/error-state";
import { use_handle_dynamic_state } from "~/hooks/use-handle-dynamic-state";
import PlusIcon from "~/icons/plus";
import UserXIcon from "~/icons/user-x";
import {
  get_blog_editors_api,
  get_query_error_type,
  number_action,
  use_get_blog_editors_query,
  use_remove_blog_editor_mutation
} from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import css from "~/theme/main.module.scss";
import { abbreviate_number } from "~/utils/abbreviate-number";
import { handle_api_error } from "~/utils/handle-api-error";

import DashboardTitle from "../../../../common/dashboard-title";
import { BlogEditorsProps } from "./editors.props";
import BlogContentEditorsRightSidebar from "./right-sidebar";
import styles from "./styles.module.scss";

const EmptyState = dynamic(() => import("./empty-state"), {
  loading: dynamic_loader()
});

const StatusHeader = ({
  editor_count: editor_count_prop
}: Pick<BlogEditorsProps, "editor_count">): React.ReactElement => {
  const blog = use_blog_context();
  const dispatch = use_app_dispatch();
  const editor_count =
    use_app_selector((state) => state.entities.blog_editor_counts[blog.id]) ||
    0;

  React.useEffect(() => {
    dispatch(number_action("blog_editor_counts", blog.id, editor_count_prop));
  }, [dispatch, blog, editor_count_prop]);

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
        {editor_count === 0 ? (
          "This blog does not have any editors."
        ) : (
          <>
            There {editor_count === 1 ? "is" : "are"}{" "}
            <span className={css["t-bold"]}>
              {abbreviate_number(editor_count)}
            </span>{" "}
            {editor_count === 1 ? "editor" : "editors"} in this blog.
          </>
        )}
      </Typography>
      <Spacer className={css["f-grow"]} size={2} />
      <Button
        check_auth
        className={clsx(styles.x, styles["header-button"])}
        decorator={<PlusIcon />}
        variant={"ghost"}
      >
        Invite
      </Button>
    </div>
  );
};

const RemoveEditorAction = ({
  user_id
}: {
  user_id: string;
}): React.ReactElement => {
  const blog = use_blog_context();
  const toast = use_toast();
  const dispatch = use_app_dispatch();
  const [remove_blog_editor, { isLoading: is_loading }] =
    use_remove_blog_editor_mutation();

  /**
   * Removes the editor from the blog
   */
  const handle_remove = (): void => {
    remove_blog_editor({ blog_id: blog.id, user_id })
      .unwrap()
      .then(() => {
        toast("Editor removed", "success");
        dispatch(get_blog_editors_api.util.resetApiState());
      })
      .catch((error) =>
        handle_api_error(error, toast, null, "Could not remove the editor")
      );
  };

  const [element] = use_confirmation(
    ({ open_confirmation }) => (
      <MenuItem
        check_auth
        decorator={<UserXIcon />}
        disabled={is_loading}
        onSelect={(event): void => {
          event.preventDefault(); // Do not auto-close the menu
          event.stopPropagation();
          open_confirmation();
        }}
      >
        Remove this editor
      </MenuItem>
    ),
    {
      color: "ruby",
      on_confirm: handle_remove,
      title: "Remove editor?",
      description:
        "This user will not be able to join again until you invite them."
    }
  );

  return element;
};

const BlogContentEditorsClient = (
  props: BlogEditorsProps
): React.ReactElement => {
  const blog = use_blog_context();
  const [page, set_page] = React.useState<number>(1);
  use_handle_dynamic_state(1, set_page);
  const {
    data,
    isLoading: is_loading,
    isFetching: is_fetching,
    isError: is_error,
    error,
    refetch
  } = use_get_blog_editors_query({
    page,
    blog_id: blog.id
  });
  const { items = [], has_more } = data || {};

  const load_more = React.useCallback(
    () => set_page((prev_state) => prev_state + 1),
    []
  );

  return (
    <React.Fragment>
      <main data-root={"true"}>
        <DashboardTitle>Editors</DashboardTitle>
        <StatusHeader {...props} />
        {is_loading || (is_fetching && page === 1) ? (
          <UserListSkeleton />
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
          <EmptyState />
        ) : (
          <VirtualizedUserList
            has_more={Boolean(has_more)}
            load_more={load_more}
            user_props={{
              custom_action: (user): React.ReactElement => (
                <RemoveEditorAction user_id={user.id} />
              )
            }}
            users={items}
          />
        )}
        <Spacer orientation={"vertical"} size={10} />
      </main>
      <BlogContentEditorsRightSidebar
        pending_editor_request_count={props.pending_editor_request_count}
      />
    </React.Fragment>
  );
};

export default BlogContentEditorsClient;
