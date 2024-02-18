"use client";

import { ImageSize } from "@storiny/shared";
import clsx from "clsx";
import NextLink from "next/link";
import React from "react";

import Image from "~/components/image";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import { select_user, sync_with_blog } from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import css from "~/theme/main.module.scss";

import BlogActions from "./actions";
import styles from "./blog.module.scss";
import { BlogProps } from "./blog.props";

const Blog = (props: BlogProps): React.ReactElement => {
  const { className, blog, virtual, ...rest } = props;
  const dispatch = use_app_dispatch();
  const current_user = use_app_selector(select_user);
  const blog_url = blog.domain || `${blog.slug}.storiny.com`;
  const is_self = current_user?.id === blog.user_id;

  React.useEffect(() => {
    dispatch(sync_with_blog(blog));
  }, [dispatch, blog]);

  return (
    <div
      {...rest}
      className={clsx(
        css.flex,
        styles.blog,
        virtual && styles.virtual,
        className
      )}
    >
      {blog.logo_id && (
        <Image
          alt={""}
          as={"a"}
          className={clsx(styles.x, styles.logo)}
          hex={blog.logo_hex}
          href={`https://${blog_url}`}
          img_key={blog.logo_id}
          rel={"noreferrer"}
          size={ImageSize.W_64}
          target={"_blank"}
          title={"Visit blog"}
        />
      )}
      <div
        className={clsx(
          css["flex-col"],
          styles.main,
          blog.logo_id && styles["has-logo"]
        )}
      >
        <div className={css.flex}>
          <NextLink
            className={clsx(css["flex-col"])}
            href={`https://${blog_url}`}
            rel={"noreferrer"}
            style={{ maxWidth: "calc(100% - 44px)" }}
            target={"_blank"}
          >
            <Typography as={"p"} className={css.ellipsis} level={"h4"}>
              {blog.name}
            </Typography>
            <Typography
              className={clsx(css["t-medium"], css.ellipsis)}
              color={"minor"}
              level={"body2"}
            >
              {blog_url} &bull;{" "}
              {is_self ? "Owner" : blog.is_editor ? "Editor" : "Writer"}
            </Typography>
          </NextLink>
          <Spacer className={css["f-grow"]} />
          <BlogActions blog={blog} />
        </div>
        {Boolean((blog.description || "").trim()) && (
          <Typography
            as={NextLink}
            className={clsx(css["t-minor"], styles.description)}
            href={`https://${blog_url}`}
            level={"body2"}
          >
            {blog.description}
          </Typography>
        )}
      </div>
    </div>
  );
};

export default React.memo(Blog);
