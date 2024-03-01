import clsx from "clsx";
import React from "react";

import Button from "~/components/button";
import IconButton from "~/components/icon-button";
import Typography from "~/components/typography";
import MailPlusIcon from "~/icons/mail-plus";
import UserPlusIcon from "~/icons/user-plus";
import BlogConnections from "~/layout/common/blog-connections";
import { boolean_action } from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import css from "~/theme/main.module.scss";

import { use_blog_context } from "../../../../../apps/web/src/common/context/blog";
import styles from "./blog-right-sidebar.module.scss";

const FollowButton = (): React.ReactElement => {
  const blog = use_blog_context();
  const dispatch = use_app_dispatch();
  const is_following = use_app_selector(
    (state) => state.entities.followed_blogs[blog.id]
  );

  return (
    <Button
      auto_size
      check_auth
      decorator={<UserPlusIcon />}
      onClick={(): void => {
        dispatch(boolean_action("followed_blogs", blog.id));
      }}
      variant={is_following ? "hollow" : "rigid"}
    >
      {is_following ? "Unfollow" : "Follow"}
    </Button>
  );
};

const DefaultBlogRightSidebarContent = (): React.ReactElement => {
  const blog = use_blog_context();
  return (
    <React.Fragment>
      <Typography as={"h1"} className={styles.name} scale={"lg"}>
        {blog.name}
      </Typography>
      {Boolean((blog.description || "").trim()) && (
        <Typography color={"minor"} level={"body2"}>
          {blog.description}
        </Typography>
      )}
      <div className={clsx(css.flex, styles.actions)}>
        <FollowButton />
        <IconButton auto_size disabled>
          <MailPlusIcon />
        </IconButton>
      </div>
      <BlogConnections is_inside_sidebar />
    </React.Fragment>
  );
};

export default DefaultBlogRightSidebarContent;
