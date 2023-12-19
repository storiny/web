"use client";

import clsx from "clsx";
import NextLink from "next/link";
import { usePathname as use_pathname } from "next/navigation";
import React from "react";

import Badge from "~/components/badge";
import Button from "~/components/button";
import Grow from "~/components/grow";
import Menu from "~/components/menu";
import MenuItem from "~/components/menu-item";
import Separator from "~/components/separator";
import Tab, { TabProps } from "~/components/tab";
import Tabs from "~/components/tabs";
import TabsList from "~/components/tabs-list";
import Typography from "~/components/typography";
import BellIcon from "~/icons/bell";
import BookmarksIcon from "~/icons/bookmarks";
import CompassIcon from "~/icons/compass";
import DotsIcon from "~/icons/dots";
import HistoryIcon from "~/icons/history";
import HomeIcon from "~/icons/home";
import PencilPlusIcon from "~/icons/pencil-plus";
import SettingsIcon from "~/icons/settings";
import StoryHeartIcon from "~/icons/story-heart";
import UserIcon from "~/icons/user";
import {
  select_is_logged_in,
  select_unread_notification_count
} from "~/redux/features";
import { use_app_selector } from "~/redux/hooks";
import css from "~/theme/main.module.scss";

import LeftSidebarPersona from "../persona";
import styles from "./default-content.module.scss";

const AnchorTab = (props: TabProps & { href: string }): React.ReactElement => (
  <Tab
    {...props}
    aria-controls={undefined}
    aria-selected={undefined}
    as={NextLink}
    className={clsx(css["full-w"], styles.tab)}
    id={undefined}
    role={undefined}
  />
);

const LeftSidebarDefaultContent = (): React.ReactElement => {
  const pathname = use_pathname();
  const logged_in = use_app_selector(select_is_logged_in);
  const unread_notification_count = use_app_selector(
    select_unread_notification_count
  );

  return (
    <>
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
        value={
          pathname === "/"
            ? "home"
            : (pathname || "").startsWith("/explore")
              ? "explore"
              : (pathname || "").substring(1)
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
          <AnchorTab decorator={<HomeIcon />} href={"/"} value={"home"}>
            Home
          </AnchorTab>
          <AnchorTab
            decorator={<CompassIcon />}
            href={"/explore"}
            value={"explore"}
          >
            Explore
          </AnchorTab>
          {logged_in && (
            <>
              <AnchorTab
                decorator={
                  <Badge
                    anchor_origin={{ vertical: "top", horizontal: "right" }}
                    inset={"24%"}
                    size={"sm"}
                    visible={unread_notification_count !== 0}
                  >
                    <BellIcon />
                  </Badge>
                }
                href={"/notifications"}
                value={"notifications"}
              >
                Notifications
              </AnchorTab>
              <AnchorTab
                decorator={<BookmarksIcon />}
                href={"/bookmarks"}
                value={"bookmarks"}
              >
                Bookmarks
              </AnchorTab>
              <Menu
                trigger={
                  <Tab
                    aria-controls={undefined}
                    aria-selected={undefined}
                    className={clsx(css["full-w"], styles.tab)}
                    decorator={<DotsIcon />}
                    id={undefined}
                    role={undefined}
                    value={"more-options"}
                  >
                    More
                  </Tab>
                }
              >
                <MenuItem
                  as={NextLink}
                  check_auth
                  decorator={<UserIcon />}
                  href={"/profile"}
                >
                  Profile
                </MenuItem>
                <MenuItem
                  as={NextLink}
                  check_auth
                  decorator={<StoryHeartIcon />}
                  href={"/liked-stories"}
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
      <Separator />
      {logged_in ? (
        <Button
          as={NextLink}
          check_auth
          decorator={<PencilPlusIcon />}
          href={"/new"}
          size={"lg"}
        >
          Write
        </Button>
      ) : (
        <>
          <Typography className={css["t-minor"]} level={"body3"}>
            Join Storiny to catch up on the latest ideas from your favorite
            writers.
          </Typography>
          <Button as={NextLink} href={"/login"} size={"lg"} variant={"hollow"}>
            Log in
          </Button>
          <Button as={NextLink} href={"/signup"} size={"lg"}>
            Sign up
          </Button>
        </>
      )}
    </>
  );
};

export default LeftSidebarDefaultContent;
