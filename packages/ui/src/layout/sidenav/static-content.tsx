"use client";

import clsx from "clsx";
import NextLink from "next/link";
import React from "react";

import Logo from "~/brand/logo";
import Badge from "~/components/badge";
import Grow from "~/components/grow";
import IconButton from "~/components/icon-button";
import Menu from "~/components/menu";
import MenuItem from "~/components/menu-item";
import Tab from "~/components/tab";
import Tabs from "~/components/tabs";
import TabsList from "~/components/tabs-list";
import BellIcon from "~/icons/bell";
import BookmarksIcon from "~/icons/bookmarks";
import CompassIcon from "~/icons/compass";
import DotsIcon from "~/icons/dots";
import HistoryIcon from "~/icons/history";
import HomeIcon from "~/icons/home";
import LoginIcon from "~/icons/login";
import PencilPlusIcon from "~/icons/pencil-plus";
import SettingsIcon from "~/icons/settings";
import StoryHeartIcon from "~/icons/story-heart";
import UserIcon from "~/icons/user";
import { select_unread_notification_count } from "~/redux/features";
import {
  select_is_logged_in,
  select_user
} from "~/redux/features/auth/selectors";
import { use_app_selector } from "~/redux/hooks";
import css from "~/theme/main.module.scss";

import styles from "./sidenav.module.scss";
import { SidenavProps } from "./sidenav.props";

const SidenavStatic = (
  props: Omit<SidenavProps, "force_mount">
): React.ReactElement | null => {
  const { className, ...rest } = props;
  const logged_in = use_app_selector(select_is_logged_in);
  const user = use_app_selector(select_user);
  const unread_notification_count = use_app_selector(
    select_unread_notification_count
  );

  return (
    <aside
      {...rest}
      className={clsx(css["flex-col"], styles.sidenav, className)}
    >
      <NextLink
        aria-label={"Storiny"}
        className={clsx(css["flex-center"], styles.branding)}
        href={"/"}
      >
        <Logo className={styles.logo} size={28} />
      </NextLink>
      <Tabs
        activationMode={"manual"}
        defaultValue={"home"}
        orientation={"vertical"}
        role={undefined}
      >
        <TabsList
          as={"nav"}
          className={clsx(css["full-w"], styles["tabs-list"])}
          loop={false}
          role={undefined}
          size={"lg"}
        >
          <Tab
            aria-label={"Homepage"}
            as={NextLink}
            decorator={<HomeIcon />}
            href={"/"}
            role={undefined}
            title={"Homepage"}
            value={"home"}
          />
          <Tab
            aria-label={"Search and explore"}
            as={NextLink}
            decorator={<CompassIcon />}
            href={"/explore"}
            role={undefined}
            title={"Explore"}
            value={"explore"}
          />
          {logged_in && (
            <>
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
                <Tab
                  aria-label={"Your notifications"}
                  as={NextLink}
                  decorator={<BellIcon />}
                  href={"/notifications"}
                  role={undefined}
                  title={"Notifications"}
                  value={"notifications"}
                />
              </Badge>
              <Tab
                aria-label={"Your bookmarks"}
                as={NextLink}
                decorator={<BookmarksIcon />}
                href={"/bookmarks"}
                role={undefined}
                title={"Bookmarks"}
                value={"bookmarks"}
              />
              <Tab
                aria-label={"Your profile"}
                as={NextLink}
                decorator={<UserIcon />}
                href={`/${user?.username}`}
                role={undefined}
                title={"Profile"}
                value={"profile"}
              />
              <Menu
                trigger={
                  <Tab
                    aria-label={"More menu options"}
                    decorator={<DotsIcon />}
                    role={undefined}
                    title={"More options"}
                    value={"more-options"}
                  />
                }
              >
                <MenuItem
                  as={NextLink}
                  check_auth
                  decorator={<StoryHeartIcon />}
                  href={"/liked"}
                >
                  Liked stories
                </MenuItem>
                <MenuItem
                  as={NextLink}
                  check_auth
                  decorator={<HistoryIcon />}
                  href={"/history"}
                >
                  History
                </MenuItem>
                <MenuItem
                  as={NextLink}
                  check_auth
                  decorator={<SettingsIcon />}
                  href={"/me"}
                >
                  Settings
                </MenuItem>
              </Menu>
            </>
          )}
        </TabsList>
      </Tabs>
      <Grow />
      <IconButton
        aria-label={"Write a new story"}
        as={NextLink}
        check_auth
        className={clsx(styles.action)}
        href={"/new"}
        size={"lg"}
        title={"Write a new story"}
      >
        {logged_in ? <PencilPlusIcon /> : <LoginIcon />}
      </IconButton>
    </aside>
  );
};

export default SidenavStatic;
