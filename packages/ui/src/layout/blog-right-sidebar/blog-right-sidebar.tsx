"use client";

import { ImageSize } from "@storiny/shared";
import { get_blog_url } from "@storiny/shared/src/utils/get-blog-url";
import { use_blog_context } from "@storiny/web/src/common/context/blog";
import clsx from "clsx";
import NextLink from "next/link";
import React from "react";

import Link from "~/components/link";
import Separator from "~/components/separator";
import Typography from "~/components/typography";
import ChevronIcon from "~/icons/chevron";
import UsersIcon from "~/icons/users";
import DefaultBlogRightSidebarContent from "~/layout/blog-right-sidebar/content";
import RightSidebar, {
  TitleWithIcon,
  UserWithActionSkeleton
} from "~/layout/right-sidebar";
import rsb_styles from "~/layout/right-sidebar/default-content/default-content.module.scss";
import UserWithAction from "~/layout/right-sidebar/user-with-action";
import { use_get_blog_editors_query } from "~/redux/features";
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
  } = use_get_blog_editors_query({ blog_id: blog.id, page: 1 });
  const { items = [] } = data || {};

  if (is_error || (!is_loading && !items.length)) {
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
        : items
            .slice(0, 5)
            .map((user) => <UserWithAction key={user.id} user={user} />)}
      {!!items.length && (
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

const BlogRightSidebar = ({
  className,
  is_homepage,
  hide_editors,
  children,
  ...rest
}: BlogRightSidebarProps): React.ReactElement | null => {
  const blog = use_blog_context();
  const blog_url = get_blog_url(blog);

  return (
    <RightSidebar
      {...rest}
      className={clsx(
        styles.x,
        styles["right-sidebar"],
        blog.banner_id && is_homepage && styles["has-banner"],
        className
      )}
      hide_footer={blog.hide_storiny_branding}
      is_blog
    >
      {children || <DefaultBlogRightSidebarContent />}
      {Boolean(blog.rsb_items?.length) && (
        <>
          <Separator />
          {(blog.rsb_items_label || "").trim() && (
            <Typography
              as={"span"}
              color={"minor"}
              ellipsis
              level={"body2"}
              style={{ width: "100%" }}
              weight={"bold"}
            >
              {blog.rsb_items_label}
            </Typography>
          )}
          {blog.rsb_items?.map((item) => (
            <NextLink
              className={clsx(css.flex, styles.item)}
              href={
                (item.target || "").startsWith(blog_url)
                  ? item.target.replace(blog_url, "")
                  : item.target
              }
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
                  ellipsis
                  level={"body2"}
                  style={{ width: "100%" }}
                  weight={"medium"}
                >
                  {item.primary_text}
                </Typography>
                {item.secondary_text && (
                  <Typography
                    color={"minor"}
                    ellipsis
                    level={"body2"}
                    style={{ width: "100%" }}
                    weight={"medium"}
                  >
                    {item.secondary_text}
                  </Typography>
                )}
              </div>
            </NextLink>
          ))}
        </>
      )}
      {!hide_editors && <Editors />}
    </RightSidebar>
  );
};

export default BlogRightSidebar;
