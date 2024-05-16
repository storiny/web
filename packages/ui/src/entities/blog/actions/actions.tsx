import { get_blog_url } from "@storiny/shared/src/utils/get-blog-url";
import React from "react";

import { use_confirmation } from "~/components/confirmation";
import IconButton from "~/components/icon-button";
import Menu from "~/components/menu";
import MenuItem from "~/components/menu-item";
import Separator from "~/components/separator";
import { use_toast } from "~/components/toast";
import DotsIcon from "~/icons/dots";
import ExternalLinkIcon from "~/icons/external-link";
import LogoutIcon from "~/icons/logout";
import SettingsIcon from "~/icons/settings";
import {
  get_replies_api,
  select_user,
  use_leave_blog_mutation
} from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import { handle_api_error } from "~/utils/handle-api-error";

import { BlogActionsProps } from "./actions.props";

const BlogActions = (props: BlogActionsProps): React.ReactElement | null => {
  const { blog } = props;
  const toast = use_toast();
  const dispatch = use_app_dispatch();
  const current_user = use_app_selector(select_user);
  const is_self = current_user?.id === blog.user_id;
  const blog_url = get_blog_url(blog);
  const role = is_self ? "owner" : blog.is_editor ? "editor" : "writer";
  const [leave_blog, { isLoading: is_loading }] = use_leave_blog_mutation();

  /**
   * Leaves a blog
   */
  const handle_leave_blog = (): void => {
    leave_blog({ id: blog.id })
      .unwrap()
      .then(() => {
        toast("You left the blog", "success");
        dispatch(get_replies_api.util.resetApiState());
      })
      .catch((error) =>
        handle_api_error(error, toast, null, "Could not leave the blog")
      );
  };

  const [leave_element] = use_confirmation(
    ({ open_confirmation }) => (
      <MenuItem
        check_auth
        decorator={<LogoutIcon />}
        disabled={is_loading}
        onSelect={(event): void => {
          event.preventDefault(); // Do not auto-close the menu
          open_confirmation();
        }}
      >
        Leave this blog
      </MenuItem>
    ),
    {
      color: "ruby",
      decorator: <LogoutIcon />,
      on_confirm: handle_leave_blog,
      title: "Leave this blog?",
      description:
        "You will not be able to join this blog unless you are invited again."
    }
  );

  return (
    <Menu
      trigger={
        <IconButton
          aria-label={"More options"}
          auto_size
          title={"More options"}
          variant={"ghost"}
        >
          <DotsIcon />
        </IconButton>
      }
    >
      <MenuItem
        as={"a"}
        decorator={<ExternalLinkIcon />}
        href={blog_url}
        rel={"noreferrer"}
        target={"_blank"}
      >
        Visit blog
      </MenuItem>
      {role !== "writer" && (
        <MenuItem
          as={"a"}
          decorator={<SettingsIcon />}
          href={`/blogs/${blog.slug}`}
          rel={"noreferrer"}
          target={"_blank"}
        >
          Blog dashboard
        </MenuItem>
      )}
      {role !== "owner" && (
        <React.Fragment>
          <Separator />
          {leave_element}
        </React.Fragment>
      )}
    </Menu>
  );
};

export default BlogActions;
