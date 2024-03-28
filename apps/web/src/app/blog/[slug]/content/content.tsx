"use client";

import { ImageSize } from "@storiny/shared";
import { get_blog_url } from "@storiny/shared/src/utils/get-blog-url";
import { clsx } from "clsx";
import NextLink from "next/link";
import { usePathname as use_pathname } from "next/navigation";
import React from "react";

import { use_blog_context } from "~/common/context/blog";
import Button from "~/components/button";
import IconButton from "~/components/icon-button";
import Tab, { TabProps } from "~/components/tab";
import Tabs from "~/components/tabs";
import TabsList from "~/components/tabs-list";
import Typography from "~/components/typography";
import { use_media_query } from "~/hooks/use-media-query";
import MailPlusIcon from "~/icons/mail-plus";
import UserPlusIcon from "~/icons/user-plus";
import BlogConnections from "~/layout/common/blog-connections";
import { boolean_action } from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import { BREAKPOINTS } from "~/theme/breakpoints";
import css from "~/theme/main.module.scss";
import { get_cdn_url } from "~/utils/get-cdn-url";

import styles from "./content.module.scss";

/**
 * Returns the value for a tab using its target URL.
 * @param target The target URL.
 * @param blog_url The URL of the blog.
 */
const get_tab_value = (target: string, blog_url: string): string => {
  if (target === blog_url) {
    return "/";
  }

  if (target.startsWith(blog_url)) {
    return target.replace(blog_url, "");
  }

  return target;
};

const AnchorTab = ({
  href,
  ...rest
}: TabProps & { href: string }): React.ReactElement => (
  <Tab
    {...rest}
    aria-controls={undefined}
    aria-selected={undefined}
    as={NextLink}
    className={clsx(css["full-w"], styles.tab)}
    href={href}
    id={undefined}
    role={undefined}
    {...(!href.startsWith("/")
      ? {
          target: "_blank",
          rel: "noreferrer"
        }
      : {})}
  />
);

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

const BlogContent = (): React.ReactElement | null => {
  const is_smaller_than_tablet = use_media_query(BREAKPOINTS.down("tablet"));
  const blog = use_blog_context();
  const pathname = use_pathname();
  const blog_url = get_blog_url(blog);

  if (!is_smaller_than_tablet) {
    return null;
  }

  return (
    <div className={clsx(css["flex-col"], styles.content)}>
      <div className={clsx(css["flex-col"], styles.details)}>
        <Typography as={"h1"} className={styles.name} scale={"xl"}>
          {blog.name}
        </Typography>
        {Boolean((blog.description || "").trim()) && (
          <Typography color={"minor"} level={"body2"}>
            {blog.description}
          </Typography>
        )}
      </div>
      <div className={clsx(css.flex, styles.actions)}>
        <FollowButton />
        <IconButton auto_size disabled>
          <MailPlusIcon />
        </IconButton>
      </div>
      <BlogConnections is_inside_sidebar={false} />
      <Tabs
        activationMode={"manual"}
        className={styles.tabs}
        orientation={"horizontal"}
        role={undefined}
        value={
          (pathname || "/").startsWith("/archive/")
            ? "/archive"
            : pathname || "/"
        }
      >
        <TabsList
          aria-orientation={undefined}
          as={"nav"}
          className={clsx(css["full-w"], styles["tabs-list"])}
          loop={false}
          role={undefined}
          size={"lg"}
        >
          {(blog.lsb_items || []).map((item) => (
            <AnchorTab
              decorator={
                item.icon ? (
                  <span
                    className={styles.icon}
                    style={{
                      backgroundImage: `url("${get_cdn_url(
                        item.icon,
                        ImageSize.W_64
                      )}")`
                    }}
                  />
                ) : undefined
              }
              href={item.target}
              key={item.id}
              value={
                (blog.lsb_items || []).filter(
                  (value) => value.target === item.target
                ).length > 1
                  ? item.target
                  : get_tab_value(item.target, blog_url)
              }
            >
              {item.name}
            </AnchorTab>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
};

export default BlogContent;
