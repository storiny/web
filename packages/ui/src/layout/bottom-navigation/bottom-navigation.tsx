"use client";

import clsx from "clsx";
import NextLink from "next/link";
import React from "react";

import Badge from "src/components/badge";
import IconButton from "src/components/icon-button";
import Tab, { TabProps } from "src/components/tab";
import Tabs from "src/components/tabs";
import TabsList from "src/components/tabs-list";
import { use_media_query } from "src/hooks/use-media-query";
import BellIcon from "src/icons/bell";
import HomeIcon from "src/icons/home";
import PencilPlusIcon from "src/icons/pencil-plus";
import SearchIcon from "src/icons/search";
import UserIcon from "src/icons/user";
import { select_unread_notification_count } from "~/redux/features";
import { select_is_logged_in } from "~/redux/features/auth/selectors";
import { use_app_selector } from "~/redux/hooks";
import { BREAKPOINTS } from "~/theme/breakpoints";

import styles from "./bottom-navigation.module.scss";
import { BottomNavigationProps } from "./bottom-navigation.props";

const AnchorTab = (props: TabProps & { href: string }): React.ReactElement => (
  <Tab
    {...props}
    aria-controls={undefined}
    aria-selected={undefined}
    as={NextLink}
    className={clsx(styles.x, styles.tab)}
    id={undefined}
    role={undefined}
  />
);

const BottomNavigation = (
  props: BottomNavigationProps
): React.ReactElement | null => {
  const { className, force_mount, ...rest } = props;
  const should_render = use_media_query(BREAKPOINTS.down("mobile"));
  const logged_in = use_app_selector(select_is_logged_in);
  const unread_notification_count = use_app_selector(
    select_unread_notification_count
  );

  // Adds `padding-bottom` to the body to compensate the height of the component
  React.useEffect(() => {
    if (force_mount || (should_render && logged_in)) {
      document.body.classList.add("bottom-navigation");
    } else {
      document.body.classList.remove("bottom-navigation");
    }

    return () => document.body.classList.remove("bottom-navigation");
  }, [force_mount, logged_in, should_render]);

  if (!force_mount && (!should_render || !logged_in)) {
    return null;
  }

  return (
    <div
      {...rest}
      className={clsx(styles.x, styles["bottom-navigation"], className)}
    >
      <Tabs
        activationMode={"manual"}
        className={"full-w"}
        defaultValue={"home"}
        role={undefined}
      >
        <TabsList
          aria-orientation={undefined}
          as={"nav"}
          className={clsx("full-w", styles.x, styles["tabs-list"])}
          loop={false}
          role={undefined}
          size={"lg"}
        >
          <AnchorTab
            aria-label={"Homepage"}
            decorator={<HomeIcon />}
            href={"/"}
            title={"Homepage"}
            value={"home"}
          />
          <AnchorTab
            aria-label={"Search and explore"}
            decorator={<SearchIcon />}
            href={"/explore"}
            title={"Search"}
            value={"explore"}
          />
          <IconButton
            aria-label={"Write a new story"}
            as={NextLink}
            check_auth
            className={clsx(styles.x, styles.cta)}
            href={"/new"}
            size={"lg"}
            title={"New story"}
          >
            <PencilPlusIcon />
          </IconButton>
          <Badge
            anchor_origin={{ vertical: "top", horizontal: "right" }}
            slot_props={{
              container: { tabIndex: -1 }
            }}
            style={{
              top: "36%",
              right: "42%"
            }}
            visible={unread_notification_count !== 0}
          >
            <AnchorTab
              aria-label={"Your notifications"}
              decorator={<BellIcon />}
              href={"/notifications"}
              title={"Notifications"}
              value={"notifications"}
            />
          </Badge>
          <AnchorTab
            aria-label={"Your profile"}
            decorator={<UserIcon />}
            href={"/profile"}
            title={"Profile"}
            value={"profile"}
          />
        </TabsList>
      </Tabs>
    </div>
  );
};

export default BottomNavigation;
