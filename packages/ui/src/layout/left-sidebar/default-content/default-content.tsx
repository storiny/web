"use client";

import clsx from "clsx";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

import Badge from "src/components/badge";
import Button from "src/components/button";
import Grow from "src/components/grow";
import Menu from "src/components/menu";
import MenuItem from "src/components/menu-item";
import Separator from "src/components/separator";
import Tab, { TabProps } from "src/components/tab";
import Tabs from "src/components/tabs";
import TabsList from "src/components/tabs-list";
import Typography from "src/components/typography";
import BellIcon from "src/icons/bell";
import BookmarksIcon from "src/icons/bookmarks";
import CompassIcon from "src/icons/compass";
import DotsIcon from "src/icons/dots";
import HistoryIcon from "src/icons/history";
import HomeIcon from "src/icons/home";
import PencilPlusIcon from "src/icons/pencil-plus";
import SettingsIcon from "src/icons/settings";
import StoryHeartIcon from "src/icons/story-heart";
import UserIcon from "src/icons/user";
import {
  select_is_logged_in,
  select_unread_notification_count
} from "~/redux/features";
import { use_app_selector } from "~/redux/hooks";

import LeftSidebarPersona from "../persona";
import styles from "./default-content.module.scss";

const AnchorTab = (props: TabProps & { href: string }): React.ReactElement => (
  <Tab
    {...props}
    aria-controls={undefined}
    aria-selected={undefined}
    as={NextLink}
    className={clsx("full-w", styles.tab)}
    id={undefined}
    role={undefined}
  />
);

const LeftSidebarDefaultContent = (): React.ReactElement => {
  const pathname = usePathname();
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
            : pathname === "/explore" ||
              // Pathname is null in tests
              (pathname || "").startsWith("/explore/")
            ? "explore"
            : (pathname || "").substring(1)
        }
      >
        <TabsList
          aria-orientation={undefined}
          as={"nav"}
          className={clsx("full-w", styles["tabs-list"])}
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
                    className={clsx("full-w", styles.tab)}
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
          <Typography className={"t-minor"} level={"body3"}>
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
