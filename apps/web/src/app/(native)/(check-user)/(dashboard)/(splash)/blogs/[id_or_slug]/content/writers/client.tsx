"use client";

import { clsx } from "clsx";
import dynamic from "next/dynamic";
import React from "react";

import { use_blog_context } from "~/common/context/blog";
import { dynamic_loader } from "~/common/dynamic";
import { UserListSkeleton, VirtualizedUserList } from "~/common/user";
import { use_confirmation } from "~/components/confirmation";
import MenuItem from "~/components/menu-item";
import Spacer from "~/components/spacer";
import { use_toast } from "~/components/toast";
import Typography from "~/components/typography";
import ErrorState from "~/entities/error-state";
import { use_handle_dynamic_state } from "~/hooks/use-handle-dynamic-state";
import { use_media_query } from "~/hooks/use-media-query";
import UserXIcon from "~/icons/user-x";
import {
  get_blog_writers_api,
  get_query_error_type,
  number_action,
  use_get_blog_writers_query,
  use_remove_blog_writer_mutation
} from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import { BREAKPOINTS } from "~/theme/breakpoints";
import css from "~/theme/main.module.scss";
import { abbreviate_number } from "~/utils/abbreviate-number";
import { handle_api_error } from "~/utils/handle-api-error";

import DashboardTitle from "../../../../common/dashboard-title";
import InviteWriter from "./invite-writer";
import BlogContentWritersRightSidebar from "./right-sidebar";
import WriterRequests from "./right-sidebar/writer-requests";
import styles from "./styles.module.scss";
import { BlogWritersProps } from "./writers.props";

const EmptyState = dynamic(() => import("./empty-state"), {
  loading: dynamic_loader()
});

const StatusHeader = ({
  writer_count: writer_count_prop
}: Pick<BlogWritersProps, "writer_count">): React.ReactElement => {
  const blog = use_blog_context();
  const is_smaller_than_desktop = use_media_query(BREAKPOINTS.down("desktop"));
  const dispatch = use_app_dispatch();
  const writer_count =
    use_app_selector((state) => state.entities.blog_writer_counts[blog.id]) ||
    0;

  React.useEffect(() => {
    dispatch(number_action("blog_writer_counts", blog.id, writer_count_prop));
  }, [dispatch, blog, writer_count_prop]);

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
        {writer_count === 0 ? (
          "This blog does not have any writers."
        ) : (
          <>
            There {writer_count === 1 ? "is" : "are"}{" "}
            <span className={css["t-bold"]}>
              {abbreviate_number(writer_count)}
            </span>{" "}
            {writer_count === 1 ? "writer" : "writers"} in this blog.
          </>
        )}
      </Typography>
      <Spacer className={css["f-grow"]} size={2} />
      {is_smaller_than_desktop && <WriterRequests />}
      <InviteWriter />
    </div>
  );
};

const RemoveWriterAction = ({
  user_id
}: {
  user_id: string;
}): React.ReactElement => {
  const blog = use_blog_context();
  const toast = use_toast();
  const dispatch = use_app_dispatch();
  const [remove_blog_writer, { isLoading: is_loading }] =
    use_remove_blog_writer_mutation();

  /**
   * Removes the writer from the blog
   */
  const handle_remove = (): void => {
    remove_blog_writer({ blog_id: blog.id, user_id })
      .unwrap()
      .then(() => {
        toast("Writer removed", "success");
        dispatch(get_blog_writers_api.util.resetApiState());
      })
      .catch((error) =>
        handle_api_error(error, toast, null, "Could not remove the writer")
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
        Remove this writer
      </MenuItem>
    ),
    {
      color: "ruby",
      on_confirm: handle_remove,
      title: "Remove this writer?",
      description:
        "This user will not be able to join again until you invite them."
    }
  );

  return element;
};

const BlogContentWritersClient = (
  props: BlogWritersProps
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
  } = use_get_blog_writers_query({
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
        <DashboardTitle>Writers</DashboardTitle>
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
                <RemoveWriterAction user_id={user.id} />
              )
            }}
            users={items}
          />
        )}
        <Spacer orientation={"vertical"} size={10} />
      </main>
      <BlogContentWritersRightSidebar
        pending_writer_request_count={props.pending_writer_request_count}
      />
    </React.Fragment>
  );
};

export default BlogContentWritersClient;
