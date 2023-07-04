"use client";

import clsx from "clsx";
import NextLink from "next/link";
import React from "react";

import Badge from "~/components/Badge";
import IconButton from "~/components/IconButton";
import Tab, { TabProps } from "~/components/Tab";
import Tabs from "~/components/Tabs";
import TabsList from "~/components/TabsList";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import BellIcon from "~/icons/Bell";
import HomeIcon from "~/icons/Home";
import PencilPlusIcon from "~/icons/PencilPlus";
import SearchIcon from "~/icons/Search";
import UserIcon from "~/icons/User";
import { selectUnreadNotificationCount } from "~/redux/features";
import { selectLoggedIn } from "~/redux/features/auth/selectors";
import { useAppSelector } from "~/redux/hooks";
import { breakpoints } from "~/theme/breakpoints";

import styles from "./BottomNavigation.module.scss";
import { BottomNavigationProps } from "./BottomNavigation.props";

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
  const { className, forceMount, ...rest } = props;
  const shouldRender = useMediaQuery(breakpoints.down("mobile"));
  const loggedIn = useAppSelector(selectLoggedIn);
  const unreadNotificationCount = useAppSelector(selectUnreadNotificationCount);

  // Adds padding-bottom to the body to compensate the height of the component
  React.useEffect(() => {
    if (forceMount || (shouldRender && loggedIn)) {
      document.body.classList.add("bottom-navigation");
    } else {
      document.body.classList.remove("bottom-navigation");
    }

    return () => document.body.classList.remove("bottom-navigation");
  }, [forceMount, loggedIn, shouldRender]);

  if (!forceMount && (!shouldRender || !loggedIn)) {
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
            checkAuth
            className={clsx(styles.x, styles.cta)}
            href={"/new"}
            size={"lg"}
            title={"New story"}
          >
            <PencilPlusIcon />
          </IconButton>
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
