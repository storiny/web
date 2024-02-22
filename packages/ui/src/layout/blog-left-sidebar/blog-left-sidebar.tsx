"use client";

import { ImageSize } from "@storiny/shared";
import { use_blog_context } from "@storiny/web/src/app/(blog)/context";
import clsx from "clsx";
import { usePathname as use_pathname } from "next/dist/client/components/navigation";
import NextLink from "next/link";
import React from "react";

import Logo from "~/brand/logo";
import Button from "~/components/button";
import Grow from "~/components/grow";
import Separator from "~/components/separator";
import Tab, { TabProps } from "~/components/tab";
import Tabs from "~/components/tabs";
import TabsList from "~/components/tabs-list";
import Typography from "~/components/typography";
import LeftSidebar from "~/layout/left-sidebar";
import LeftSidebarPersona from "~/layout/left-sidebar/persona";
import { select_is_logged_in } from "~/redux/features";
import { use_app_selector } from "~/redux/hooks";
import css from "~/theme/main.module.scss";
import { get_cdn_url } from "~/utils/get-cdn-url";

import styles from "./blog-left-sidebar.module.scss";
import { BlogLeftSidebarProps } from "./blog-left-sidebar.props";

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

const BlogLeftSidebar = ({
  className,
  ...rest
}: BlogLeftSidebarProps): React.ReactElement | null => {
  const blog = use_blog_context();
  const pathname = use_pathname();
  const logged_in = use_app_selector(select_is_logged_in);

  return (
    <LeftSidebar
      {...rest}
      className={clsx(
        styles.x,
        styles["left-sidebar"],
        blog.banner_id && styles["has-banner"],
        className
      )}
    >
      {logged_in && (
        <>
          <LeftSidebarPersona />
          <Separator />
        </>
      )}
      <Tabs
        activationMode={"manual"}
        className={styles.tabs}
        orientation={"vertical"}
        role={undefined}
        value={pathname || "/"}
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
              value={item.target}
            >
              {item.name}
            </AnchorTab>
          ))}
        </TabsList>
      </Tabs>
      <Grow />
      {!blog.hide_storiny_branding && (
        <React.Fragment>
          <Separator />
          <Typography className={css["t-minor"]} level={"body3"}>
            This blog is powered by Storiny.
          </Typography>
          <Button
            as={NextLink}
            decorator={<Logo size={18} />}
            href={`${process.env.NEXT_PUBLIC_WEB_URL}/membership`}
            size={"lg"}
            variant={"hollow"}
          >
            Publish with Storiny
          </Button>
        </React.Fragment>
      )}
    </LeftSidebar>
  );
};

export default BlogLeftSidebar;
