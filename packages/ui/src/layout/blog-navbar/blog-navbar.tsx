"use client";

import { ImageSize } from "@storiny/shared";
import { use_blog_context } from "@storiny/web/src/app/(blog)/context";
import clsx from "clsx";
import NextLink from "next/link";
import React from "react";

import Logo from "~/brand/logo";
import Image from "~/components/image";
import { select_resolved_theme } from "~/redux/features";
import { select_is_logged_in } from "~/redux/features/auth/selectors";
import { use_app_selector } from "~/redux/hooks";
import css from "~/theme/main.module.scss";
import { get_cdn_url } from "~/utils/get-cdn-url";

import Actions from "./actions";
import styles from "./blog-navbar.module.scss";
import { BlogNavbarProps } from "./blog-navbar.props";

const BlogNavbar = (props: BlogNavbarProps): React.ReactElement => {
  const { className, ...rest } = props;
  const theme = use_app_selector(select_resolved_theme);
  const logged_in = use_app_selector(select_is_logged_in);
  const blog = use_blog_context();
  const is_transparent = Boolean(blog.banner_id);

  return (
    <header
      {...rest}
      className={clsx(
        styles.navbar,
        is_transparent && styles.transparent,
        logged_in && styles["logged-in"],
        className
      )}
      data-global-header={"true"}
      role={"banner"}
    >
      {blog.banner_id && (
        <Image
          alt={""}
          aria-hidden={"true"}
          className={styles.banner}
          hex={blog.banner_hex}
          img_key={blog.banner_id}
          slot_props={{
            fallback: {
              style: { display: "none" }
            },
            image: {
              className: styles["banner-img"],
              loading: "eager",
              draggable: false,
              sizes: "100vw",
              // eslint-disable-next-line prefer-snakecase/prefer-snakecase
              srcSet: [
                `${get_cdn_url(blog.banner_id, ImageSize.W_2440)} 2440w`,
                `${get_cdn_url(blog.banner_id, ImageSize.W_1920)} 1920w`,
                `${get_cdn_url(blog.banner_id, ImageSize.W_1440)} 1440w`,
                `${get_cdn_url(blog.banner_id, ImageSize.W_1200)} 1200w`,
                `${get_cdn_url(blog.banner_id, ImageSize.W_960)} 960w`,
                `${get_cdn_url(blog.banner_id, ImageSize.W_640)} 640w`
              ].join(",")
            }
          }}
        />
      )}
      <nav className={clsx(css["f-grow"], styles.nav)}>
        <NextLink
          aria-label={"Homepage"}
          className={clsx(css["flex-center"], styles.mark, css["focusable"])}
          href={"/"}
          title={"Go to homepage"}
        >
          {blog.mark_dark || blog.mark_light ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt={blog.name}
              className={styles["mark-image"]}
              draggable={false}
              src={get_cdn_url(
                theme === "dark" && blog.mark_dark !== null
                  ? blog.mark_dark
                  : blog.mark_light,
                ImageSize.W_320
              )}
            />
          ) : (
            <Logo role={"presentation"} size={28} />
          )}
        </NextLink>
        <Actions is_transparent={is_transparent} />
      </nav>
    </header>
  );
};

export default BlogNavbar;
