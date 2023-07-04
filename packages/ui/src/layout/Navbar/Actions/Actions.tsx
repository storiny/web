import { User } from "@storiny/types";
import clsx from "clsx";
import NextLink from "next/link";
import React from "react";

import Avatar from "~/components/Avatar";
import Button from "~/components/Button";
import IconButton from "~/components/IconButton";
import Menu, { MenuProps } from "~/components/Menu";
import MenuItem, {
  MenuItemProps,
  MenuItemUnstyled
} from "~/components/MenuItem";
import Separator from "~/components/Separator";
import Skeleton from "~/components/Skeleton";
import Persona from "~/entities/Persona";
import Status from "~/entities/Status";
import BookmarksIcon from "~/icons/Bookmarks";
import ChevronIcon from "~/icons/Chevron";
import CloudOffIcon from "~/icons/CloudOff";
import ContributionIcon from "~/icons/Contribution";
import DotsIcon from "~/icons/Dots";
import ExplicitIcon from "~/icons/Explicit";
import HistoryIcon from "~/icons/History";
import LogoutIcon from "~/icons/Logout";
import QuestionMarkIcon from "~/icons/QuestionMark";
import SettingsIcon from "~/icons/Settings";
import StoryIcon from "~/icons/Story";
import StoryHeartIcon from "~/icons/StoryHeart";
import SunIcon from "~/icons/Sun";
import UserIcon from "~/icons/User";
import {
  selectAuthStatus,
  selectLoggedIn,
  selectUser
} from "~/redux/features/auth/selectors";
import { setTheme } from "~/redux/features/preferences/slice";
import { useAppDispatch, useAppSelector } from "~/redux/hooks";
import { capitalize } from "~/utils/capitalize";

import styles from "./Actions.module.scss";

// MenuItem used to toggle theme

const ThemeToggleItem = (): React.ReactElement => {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.preferences.theme);

  return (
    <MenuItem
      decorator={<SunIcon />}
      onSelect={(event): void => {
        // Prevent menu from closing
        event.preventDefault();
        dispatch(
          setTheme(
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
              avatarId: user?.avatar_id,
              label: user?.name
            }}
            primaryText={user?.name}
            secondaryText={`@${user?.username}`}
            size={"sm"}
          />
        </NextLink>
      </MenuItemUnstyled>
      <MenuItemUnstyled asChild>
        <Status className={clsx(styles["menu-item"])} editable />
      </MenuItemUnstyled>
    </div>
    <Separator />
    <MenuItemWithLink decorator={<UserIcon />} href={"/profile"}>
      Your profile
    </MenuItemWithLink>
    <MenuItemWithLink decorator={<StoryIcon />} href={"/me/stories"}>
      Your stories
    </MenuItemWithLink>
    <MenuItemWithLink decorator={<BookmarksIcon />} href={"/bookmarks"}>
      Bookmarks
    </MenuItemWithLink>
    <MenuItemWithLink decorator={<StoryHeartIcon />} href={"/liked"}>
      Liked stories
    </MenuItemWithLink>
    <MenuItemWithLink decorator={<HistoryIcon />} href={"/history"}>
      History
    </MenuItemWithLink>
    <Separator />
    <ThemeToggleItem />
    <MenuItem decorator={<ExplicitIcon />}>Safe mode</MenuItem>
    <Separator />
    <MenuItemWithLink decorator={<SettingsIcon />} href={"/me"}>
      Settings
    </MenuItemWithLink>
    <MenuItem decorator={<QuestionMarkIcon />}>Help</MenuItem>
    <MenuItemWithLink decorator={<LogoutIcon />} href={"/logout"}>
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
  const loggedIn = useAppSelector(selectLoggedIn);
  const authStatus = useAppSelector(selectAuthStatus);
  const user = useAppSelector(selectUser);

  return (
    <div className={clsx("flex-center", styles.actions)}>
      {loggedIn ? (
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
                  avatarId={user?.avatar_id}
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
