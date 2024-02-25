import { use_blog_context } from "@storiny/web/src/app/blog/[slug]/context";
import clsx from "clsx";
import dynamic from "next/dynamic";
import React from "react";

import IconButton from "~/components/icon-button";
import Separator from "~/components/separator";
import MailIcon from "~/icons/mail";
import WorldIcon from "~/icons/world";
import css from "~/theme/main.module.scss";

import styles from "./blog-connections.module.scss";

const IconMap = {
  Discord: dynamic(() => import("~/icons/discord")),
  GitHub: dynamic(() => import("~/icons/github")),
  LinkedIn: dynamic(() => import("~/icons/linkedin")),
  YouTube: dynamic(() => import("~/icons/youtube")),
  Twitch: dynamic(() => import("~/icons/twitch")),
  Twitter: dynamic(() => import("~/icons/twitter")),
  Instagram: dynamic(() => import("~/icons/instagram"))
} as const;

const BlogConnections = ({
  is_inside_sidebar
}: {
  is_inside_sidebar: boolean;
}): React.ReactElement | null => {
  const blog = use_blog_context();
  const connections = React.useMemo(() => {
    const items: React.ReactElement[] = [];

    if (blog.website_url) {
      items.push(
        <IconButton
          aria-label={`${blog.name} website`}
          as={"a"}
          className={clsx(styles.x, styles.connection)}
          href={blog.website_url}
          key={"website"}
          rel={"noreferrer"}
          size={is_inside_sidebar ? "md" : "lg"}
          target={"_blank"}
          title={`${blog.name} website`}
          variant={"ghost"}
        >
          <WorldIcon />
        </IconButton>
      );
    }

    if (blog.public_email) {
      items.push(
        <IconButton
          aria-label={`${blog.name} email`}
          as={"a"}
          className={clsx(styles.x, styles.connection)}
          href={`mailto:${blog.public_email}`}
          key={"email"}
          size={is_inside_sidebar ? "md" : "lg"}
          title={`${blog.name} email`}
          variant={"ghost"}
        >
          <MailIcon />
        </IconButton>
      );
    }

    if (blog.github_id) {
      items.push(
        <IconButton
          aria-label={`${blog.name} on GitHub`}
          as={"a"}
          className={clsx(styles.x, styles.connection)}
          href={`https://github.com/${blog.github_id}`}
          key={"github"}
          rel={"noreferrer"}
          size={is_inside_sidebar ? "md" : "lg"}
          target={"_blank"}
          title={`${blog.name} on GitHub`}
          variant={"ghost"}
        >
          <IconMap.GitHub />
        </IconButton>
      );
    }

    if (blog.youtube_id) {
      items.push(
        <IconButton
          aria-label={`${blog.name} on YouTube`}
          as={"a"}
          className={clsx(styles.x, styles.connection)}
          href={`https://youtube.com/channel/${blog.youtube_id}`}
          key={"youtube"}
          rel={"noreferrer"}
          size={is_inside_sidebar ? "md" : "lg"}
          target={"_blank"}
          title={`${blog.name} on YouTube`}
          variant={"ghost"}
        >
          <IconMap.YouTube />
        </IconButton>
      );
    }

    if (blog.twitter_id) {
      items.push(
        <IconButton
          aria-label={`${blog.name} on Twitter`}
          as={"a"}
          className={clsx(styles.x, styles.connection)}
          href={`https://twitter.com/${blog.twitter_id}`}
          key={"twitter"}
          rel={"noreferrer"}
          size={is_inside_sidebar ? "md" : "lg"}
          target={"_blank"}
          title={`${blog.name} on Twitter`}
          variant={"ghost"}
        >
          <IconMap.Twitter />
        </IconButton>
      );
    }

    if (blog.instagram_id) {
      items.push(
        <IconButton
          aria-label={`${blog.name} on Instagram`}
          as={"a"}
          className={clsx(styles.x, styles.connection)}
          href={`https://instagram.com/${blog.instagram_id}`}
          key={"instagram"}
          rel={"noreferrer"}
          size={is_inside_sidebar ? "md" : "lg"}
          target={"_blank"}
          title={`${blog.name} on Instagram`}
          variant={"ghost"}
        >
          <IconMap.Instagram />
        </IconButton>
      );
    }

    if (blog.linkedin_id) {
      items.push(
        <IconButton
          aria-label={`${blog.name} on LinkedIn`}
          as={"a"}
          className={clsx(styles.x, styles.connection)}
          href={`https://linkedin.com/in/${blog.linkedin_id}`}
          key={"linkedin"}
          rel={"noreferrer"}
          size={is_inside_sidebar ? "md" : "lg"}
          target={"_blank"}
          title={`${blog.name} on LinkedIn`}
          variant={"ghost"}
        >
          <IconMap.LinkedIn />
        </IconButton>
      );
    }

    if (blog.twitch_id) {
      items.push(
        <IconButton
          aria-label={`${blog.name} on Twitch`}
          as={"a"}
          className={clsx(styles.x, styles.connection)}
          href={`https://twitch.tv/${blog.twitch_id}`}
          key={"twitch"}
          rel={"noreferrer"}
          size={is_inside_sidebar ? "md" : "lg"}
          target={"_blank"}
          title={`${blog.name} on Twitch`}
          variant={"ghost"}
        >
          <IconMap.Twitch />
        </IconButton>
      );
    }

    return items;
  }, [blog, is_inside_sidebar]);

  if (!connections.length) {
    return null;
  }

  return (
    <React.Fragment>
      <Separator />
      <div className={clsx(css.flex, styles.connections)}>{connections}</div>
    </React.Fragment>
  );
};

export default BlogConnections;
