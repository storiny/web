"use client";

import { ImageSize } from "@storiny/shared";
import { use_blog_context } from "@storiny/web/src/app/(blog)/context";
import clsx from "clsx";
import NextLink from "next/link";
import React from "react";

import Button from "~/components/button";
import IconButton from "~/components/icon-button";
import Link from "~/components/link";
import Separator from "~/components/separator";
import Typography from "~/components/typography";
import ChevronIcon from "~/icons/chevron";
import MailPlusIcon from "~/icons/mail-plus";
import UserPlusIcon from "~/icons/user-plus";
import UsersIcon from "~/icons/users";
import BlogConnections from "~/layout/common/blog-connections";
import RightSidebar, {
  TitleWithIcon,
  UserWithActionSkeleton
} from "~/layout/right-sidebar";
import rsb_styles from "~/layout/right-sidebar/default-content/default-content.module.scss";
import UserWithAction from "~/layout/right-sidebar/user-with-action";
import { boolean_action, use_get_blog_editors_query } from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import css from "~/theme/main.module.scss";
import { get_cdn_url } from "~/utils/get-cdn-url";

import styles from "./blog-right-sidebar.module.scss";
import { BlogRightSidebarProps } from "./blog-right-sidebar.props";

const Editors = (): React.ReactElement | null => {
  const blog = use_blog_context();
  const {
    data,
    isLoading: is_loading,
    isError: is_error
  } = use_get_blog_editors_query({ id: blog.id });

  if (is_error || (!is_loading && !data?.length)) {
    return null;
  }

  return (
    <>
      <Separator />
      <TitleWithIcon icon={<UsersIcon />}>Editors</TitleWithIcon>
      {is_loading
        ? [...Array(5)].map((_, index) => (
            <UserWithActionSkeleton key={index} />
          ))
        : data?.map((user) => <UserWithAction key={user.id} user={user} />)}
      {data && (
        <div className={rsb_styles["show-more-wrapper"]}>
          <Link
            className={clsx(
              css["flex-center"],
              css["t-bold"],
              rsb_styles["show-more"]
            )}
            href={"/editors"}
            level={"body3"}
          >
            Show more
            <ChevronIcon rotation={90} />
          </Link>
        </div>
      )}
    </>
  );
};

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

const BlogRightSidebar = ({
  className,
  ...rest
}: BlogRightSidebarProps): React.ReactElement | null => {
  const blog = use_blog_context();

  return (
    <RightSidebar
      {...rest}
      className={clsx(
        styles.x,
        styles["right-sidebar"],
        blog.banner_id && styles["has-banner"],
        className
      )}
      hide_footer={blog.hide_storiny_branding}
      is_blog
    >
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
      {Boolean(blog.rsb_items?.length) && (
        <>
          <Separator />
          {(blog.rsb_items_label || "").trim() && (
            <Typography
              as={"span"}
              className={clsx(css["t-minor"], css["t-bold"])}
              ellipsis
              level={"body2"}
              style={{ width: "100%" }}
            >
              {blog.rsb_items_label}
            </Typography>
          )}
          {blog.rsb_items?.map((item) => (
            <NextLink
              className={clsx(css.flex, styles.item)}
              href={item.target}
              key={item.id}
              rel={"noreferrer"}
              target={"_blank"}
            >
              {item.icon && (
                <span
                  className={styles.icon}
                  style={{
                    backgroundImage: `url("${get_cdn_url(
                      item.icon,
                      ImageSize.W_64
                    )}")`
                  }}
                />
              )}
              <div className={clsx(css["flex-col"])}>
                <Typography
                  className={css["t-medium"]}
                  ellipsis
                  level={"body2"}
                  style={{ width: "100%" }}
                >
                  {item.primary_text}
                </Typography>
                {item.secondary_text && (
                  <Typography
                    className={css["t-medium"]}
                    color={"minor"}
                    ellipsis
                    level={"body2"}
                    style={{ width: "100%" }}
                  >
                    {item.secondary_text}
                  </Typography>
                )}
              </div>
            </NextLink>
          ))}
        </>
      )}
      <Editors />
    </RightSidebar>
  );
};

export default BlogRightSidebar;
