"use client";

import clsx from "clsx";
import NextLink from "next/link";
import React from "react";

import Logo from "~/brand/Logo";
import Badge from "~/components/Badge";
import Grow from "~/components/Grow";
import IconButton from "~/components/IconButton";
import Menu from "~/components/Menu";
import MenuItem from "~/components/MenuItem";
import Tab from "~/components/Tab";
import Tabs from "~/components/Tabs";
import TabsList from "~/components/TabsList";
import BellIcon from "~/icons/Bell";
import BookmarksIcon from "~/icons/Bookmarks";
import CompassIcon from "~/icons/Compass";
import DotsIcon from "~/icons/Dots";
import HistoryIcon from "~/icons/History";
import HomeIcon from "~/icons/Home";
import LoginIcon from "~/icons/Login";
import PencilPlusIcon from "~/icons/PencilPlus";
import SettingsIcon from "~/icons/Settings";
import StoryHeartIcon from "~/icons/StoryHeart";
import UserIcon from "~/icons/User";
import { select_unread_notification_count } from "~/redux/features";
import { selectLoggedIn, selectUser } from "~/redux/features/auth/selectors";
import { useAppSelector } from "~/redux/hooks";

import styles from "./Sidenav.module.scss";
import { SidenavProps } from "./Sidenav.props";

const SidenavStatic = (
  props: Omit<SidenavProps, "forceMount">
): React.ReactElement | null => {
  const { className, ...rest } = props;
  const loggedIn = useAppSelector(selectLoggedIn);
  const user = useAppSelector(selectUser);
  const unreadNotificationCount = useAppSelector(
    select_unread_notification_count
  );

  return (
    <aside {...rest} className={clsx("flex-col", styles.sidenav, className)}>
      <NextLink
        aria-label={"Storiny"}
        className={clsx("flex-center", styles.branding)}
        href={"/"}
      >
        <Logo className={clsx(styles.logo)} size={28} />
      </NextLink>
      <Tabs
        activationMode={"manual"}
        defaultValue={"home"}
        orientation={"vertical"}
        role={undefined}
      >
        <TabsList
          as={"nav"}
          className={clsx("full-w", styles["tabs-list"])}
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
          {loggedIn && (
            <>
              <Badge
                anchorOrigin={{ vertical: "top", horizontal: "right" }}
                slotProps={{
                  container: { tabIndex: -1 }
                }}
                style={{
                  top: "36%",
                  right: "42%"
                }}
                visible={unreadNotificationCount !== 0}
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
                  checkAuth
                  decorator={<StoryHeartIcon />}
                  href={"/liked"}
                >
                  Liked stories
                </MenuItem>
                <MenuItem
                  as={NextLink}
                  checkAuth
                  decorator={<HistoryIcon />}
                  href={"/history"}
                >
                  History
                </MenuItem>
                <MenuItem
                  as={NextLink}
                  checkAuth
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
        checkAuth
        className={clsx(styles.action)}
        href={"/new"}
        size={"lg"}
        title={"Write a new story"}
      >
        {loggedIn ? <PencilPlusIcon /> : <LoginIcon />}
      </IconButton>
    </aside>
  );
};

export default SidenavStatic;
