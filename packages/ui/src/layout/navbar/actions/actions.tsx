import { User } from "@storiny/types";
import clsx from "clsx";
import NextLink from "next/link";
import React from "react";

import Avatar from "src/components/avatar";
import Button from "src/components/button";
import IconButton from "src/components/icon-button";
import Menu, { MenuProps } from "src/components/menu";
import MenuItem, {
  MenuItemProps,
  MenuItemUnstyled
} from "src/components/menu-item";
import Separator from "src/components/separator";
import Skeleton from "src/components/skeleton";
import Persona from "src/entities/persona";
import Status from "src/entities/status";
import AdjustIcon from "~/icons/Adjust";
import BookmarksIcon from "~/icons/Bookmarks";
import ChevronIcon from "~/icons/Chevron";
import CloudOffIcon from "~/icons/CloudOff";
import DotsIcon from "~/icons/Dots";
import ExplicitIcon from "~/icons/Explicit";
import HistoryIcon from "~/icons/History";
import LogoutIcon from "~/icons/Logout";
import MoonIcon from "~/icons/Moon";
import QuestionMarkIcon from "~/icons/QuestionMark";
import SettingsIcon from "~/icons/Settings";
import StoryIcon from "~/icons/Story";
import StoryHeartIcon from "~/icons/StoryHeart";
import SunIcon from "~/icons/Sun";
import UserIcon from "~/icons/User";
import {
  select_auth_status,
  select_is_logged_in,
  select_user
} from "~/redux/features/auth/selectors";
import { set_theme } from "~/redux/features/preferences/slice";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import { capitalize } from "~/utils/capitalize";

import styles from "./actions.module.scss";

// MenuItem used to toggle theme

const ThemeToggleItem = (): React.ReactElement => {
  const dispatch = use_app_dispatch();
  const theme = use_app_selector((state) => state.preferences.theme);

  return (
    <MenuItem
      decorator={
        theme === "light" ? (
          <SunIcon />
        ) : theme === "dark" ? (
          <MoonIcon />
        ) : (
          <AdjustIcon rotation={90} />
        )
      }
      onSelect={(event): void => {
        // Prevent the menu from closing
        event.preventDefault();
        dispatch(
          set_theme(
            theme === "system" ? "light" : theme === "light" ? "dark" : "system"
          )
        );
      }}
    >
      Theme: {capitalize(theme)}
    </MenuItem>
  );
};

// MenuItem as anchor

const MenuItemWithLink = ({
  children,
  ...rest
}: MenuItemProps & { href: string }): React.ReactElement => (
  <MenuItem {...rest} as={NextLink}>
    {children}
  </MenuItem>
);

// Logged in Menu

const LoggedInMenu = ({
  user,
  trigger
}: Pick<MenuProps, "trigger"> & {
  user: User | null;
}): React.ReactElement => (
  <Menu trigger={trigger}>
    <div className={clsx(styles.menu)}>
      <MenuItemUnstyled
        asChild
        className={clsx("focusable", styles["menu-item"])}
      >
        <NextLink aria-label={"Go to your profile"} href={"/profile"}>
          <Persona
            avatar={{
              alt: "",
              hex: user?.avatar_hex,
              avatar_id: user?.avatar_id,
              label: user?.name
            }}
            primary_text={user?.name}
            secondary_text={`@${user?.username}`}
            size={"sm"}
          />
        </NextLink>
      </MenuItemUnstyled>
      <MenuItemUnstyled asChild>
        <Status className={clsx(styles["menu-item"])} editable />
      </MenuItemUnstyled>
    </div>
    <Separator />
    <MenuItemWithLink check_auth decorator={<UserIcon />} href={"/profile"}>
      Your profile
    </MenuItemWithLink>
    <MenuItemWithLink check_auth decorator={<StoryIcon />} href={"/me/stories"}>
      Your stories
    </MenuItemWithLink>
    <MenuItemWithLink
      check_auth
      decorator={<BookmarksIcon />}
      href={"/bookmarks"}
    >
      Bookmarks
    </MenuItemWithLink>
    <MenuItemWithLink check_auth decorator={<StoryHeartIcon />} href={"/liked"}>
      Liked stories
    </MenuItemWithLink>
    <MenuItemWithLink check_auth decorator={<HistoryIcon />} href={"/history"}>
      History
    </MenuItemWithLink>
    <Separator />
    <ThemeToggleItem />
    {/* TODO(future): <MenuItem decorator={<ExplicitIcon />}>Safe mode</MenuItem>*/}
    <Separator />
    <MenuItemWithLink check_auth decorator={<SettingsIcon />} href={"/me"}>
      Settings
    </MenuItemWithLink>
    <MenuItem decorator={<QuestionMarkIcon />}>Help</MenuItem>
    <MenuItemWithLink check_auth decorator={<LogoutIcon />} href={"/logout"}>
      Logout
    </MenuItemWithLink>
  </Menu>
);

// Logged out menu

const LoggedOutMenu = ({
  trigger
}: Pick<MenuProps, "trigger">): React.ReactElement => (
  <Menu trigger={trigger}>
    <ThemeToggleItem />
    <Separator />
    <MenuItem decorator={<QuestionMarkIcon />}>Help</MenuItem>
  </Menu>
);

const Actions = (): React.ReactElement => {
  const logged_in = use_app_selector(select_is_logged_in);
  const authStatus = use_app_selector(select_auth_status);
  const user = use_app_selector(select_user);

  return (
    <div className={clsx("flex-center", styles.actions)}>
      {logged_in ? (
        ["loading", "error"].includes(authStatus) ? (
          <LoggedOutMenu
            trigger={
              <div
                aria-busy
                className={clsx("unset", "flex-center", styles.trigger)}
              >
                {authStatus === "loading" ? (
                  <Skeleton height={32} shape={"circular"} width={32} />
                ) : (
                  <Avatar className={styles["error-avatar"]}>
                    <CloudOffIcon />
                  </Avatar>
                )}
                <ChevronIcon rotation={180} />
              </div>
            }
          />
        ) : (
          <LoggedInMenu
            trigger={
              <button
                aria-label={"Site and account options"}
                className={clsx(
                  "unset",
                  "focusable",
                  "flex-center",
                  styles.trigger
                )}
                type={"button"}
              >
                <Avatar
                  alt={""}
                  avatar_id={user?.avatar_id}
                  hex={user?.avatar_hex}
                  label={user?.name}
                />
                <ChevronIcon rotation={180} />
              </button>
            }
            user={user}
          />
        )
      ) : (
        <>
          <Button as={NextLink} href={"/login"} variant={"ghost"}>
            Log in
          </Button>
          <Button as={NextLink} href={"/signup"} variant={"hollow"}>
            Sign up
          </Button>
          <LoggedOutMenu
            trigger={
              <IconButton
                aria-label={"Site options"}
                title={"More options"}
                variant={"ghost"}
              >
                <DotsIcon />
              </IconButton>
            }
          />
        </>
      )}
    </div>
  );
};

export default Actions;
