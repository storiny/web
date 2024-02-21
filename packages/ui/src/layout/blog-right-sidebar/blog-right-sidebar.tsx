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
import MailIcon from "~/icons/mail";
import UsersIcon from "~/icons/users";
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

const BlogRightSidebar = (
  props: BlogRightSidebarProps
): React.ReactElement | null => {
  const blog = use_blog_context();

  return (
    <RightSidebar {...props}>
      <Typography as={"h1"} scale={"lg"}>
        {blog.name}
      </Typography>
      {Boolean((blog.description || "").trim()) && (
        <Typography color={"minor"} level={"body2"}>
          {blog.description}
        </Typography>
      )}
      <div className={clsx(css.flex, styles.actions)}>
        <Button>Follow</Button>
        <IconButton disabled>
          <MailIcon />
        </IconButton>
      </div>
      <Separator />
      {Boolean(blog.rsb_items?.length) && (
        <>
          <Separator />
          {(blog.rsb_items_label || "").trim() && (
            <TitleWithIcon icon={<UsersIcon />}>
              {blog.rsb_items_label}
            </TitleWithIcon>
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
                <Typography className={css["t-medium"]} level={"body2"}>
                  {item.primary_text}
                </Typography>
                <Typography
                  className={css["t-medium"]}
                  color={"minor"}
                  level={"body2"}
                >
                  {item.secondary_text}
                </Typography>
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
