"use client";

import clsx from "clsx";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

import Badge from "~/components/Badge";
import Button from "~/components/Button";
import Grow from "~/components/Grow";
import Menu from "~/components/Menu";
import MenuItem from "~/components/MenuItem";
import Separator from "~/components/Separator";
import Tab, { TabProps } from "~/components/Tab";
import Tabs from "~/components/Tabs";
import TabsList from "~/components/TabsList";
import Typography from "~/components/Typography";
import BellIcon from "~/icons/Bell";
import BookmarksIcon from "~/icons/Bookmarks";
import CompassIcon from "~/icons/Compass";
import ContributionIcon from "~/icons/Contribution";
import DotsIcon from "~/icons/Dots";
import HistoryIcon from "~/icons/History";
import HomeIcon from "~/icons/Home";
import PencilPlusIcon from "~/icons/PencilPlus";
import SettingsIcon from "~/icons/Settings";
import StoryHeartIcon from "~/icons/StoryHeart";
import UserIcon from "~/icons/User";
import { selectLoggedIn } from "~/redux/features";
import { useAppSelector } from "~/redux/hooks";

import LeftSidebarPersona from "../Persona";
import styles from "./DefaultContent.module.scss";

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
  const loggedIn = useAppSelector(selectLoggedIn);
  const pathname = usePathname();

  return (
    <>
      {loggedIn && (
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
              // pathname is null in tests
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
          {loggedIn && (
            <>
              <AnchorTab
                decorator={
                  <Badge
                    anchorOrigin={{ vertical: "top", horizontal: "right" }}
                    inset={"24%"}
                    size={"sm"}
                    visible={false}
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
                  decorator={<UserIcon />}
                  href={"/profile"}
                >
                  Profile
                </MenuItem>
                <MenuItem
                  as={NextLink}
                  decorator={<StoryHeartIcon />}
                  href={"/liked"}
                >
                  Liked stories
                </MenuItem>
                <MenuItem
                  as={NextLink}
                  decorator={<ContributionIcon />}
                  href={"/contributions"}
                >
                  Contributions
                </MenuItem>
                <MenuItem
                  as={NextLink}
                  decorator={<HistoryIcon />}
                  href={"/history"}
                >
                  History
                </MenuItem>
                <MenuItem
                  as={NextLink}
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
      {loggedIn ? (
        <Button
          as={NextLink}
          checkAuth
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
