import { User } from "@storiny/types";
import { use_blog_context } from "@storiny/web/src/app/(blog)/context";
import clsx from "clsx";
import NextLink from "next/link";
import React from "react";

import Avatar from "~/components/avatar";
import IconButton from "~/components/icon-button";
import Menu, { MenuProps } from "~/components/menu";
import MenuItem, {
  MenuItemProps,
  MenuItemUnstyled
} from "~/components/menu-item";
import Separator from "~/components/separator";
import Skeleton from "~/components/skeleton";
import Persona from "~/entities/persona";
import Status from "~/entities/status";
import AdjustIcon from "~/icons/adjust";
import ArchiveIcon from "~/icons/archive";
import CloudOffIcon from "~/icons/cloud-off";
import LoginIcon from "~/icons/login";
import LogoutIcon from "~/icons/logout";
import MoonIcon from "~/icons/moon";
import QuestionMarkIcon from "~/icons/question-mark";
import SearchIcon from "~/icons/search";
import SettingsIcon from "~/icons/settings";
import SunIcon from "~/icons/sun";
import UserIcon from "~/icons/user";
import {
  select_auth_status,
  select_is_logged_in,
  select_user
} from "~/redux/features/auth/selectors";
import { set_theme } from "~/redux/features/preferences/slice";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import css from "~/theme/main.module.scss";
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
  trigger,
  force_theme
}: Pick<MenuProps, "trigger"> & {
  force_theme?: boolean;
  user: User | null;
}): React.ReactElement => (
  <Menu trigger={trigger}>
    <div className={clsx(styles.menu)}>
      <MenuItemUnstyled
        asChild
        className={clsx(css["focusable"], styles["menu-item"])}
      >
        <NextLink
          aria-label={"Go to your profile"}
          href={`/${user?.username || "profile"}`}
        >
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
      <MenuItemUnstyled
        asChild
        onSelect={(event): void => {
          event.preventDefault(); // Do not close when the status modal is mounted
        }}
      >
        <Status
          className={clsx(styles["menu-item"])}
          emoji={user?.status?.emoji}
          expires_at={user?.status?.expires_at}
          modal_props={{
            modal: true
          }}
          style={{ maxWidth: "165px" }}
          text={user?.status?.text}
          user_id={user?.id || ""}
        />
      </MenuItemUnstyled>
    </div>
    {!force_theme && (
      <React.Fragment>
        <Separator />
        <ThemeToggleItem />
      </React.Fragment>
    )}
    <Separator />
    <ThemeToggleItem />
    <MenuItemWithLink
      decorator={<QuestionMarkIcon />}
      href={"mailto:support@storiny.com"}
    >
      Help
    </MenuItemWithLink>
    <MenuItemWithLink check_auth decorator={<LogoutIcon />} href={"/logout"}>
      Logout
    </MenuItemWithLink>
  </Menu>
);

// Logged out menu

const LoggedOutMenu = ({
  trigger,
  force_theme
}: Pick<MenuProps, "trigger"> & {
  force_theme?: boolean;
}): React.ReactElement => (
  <Menu trigger={trigger}>
    <MenuItemWithLink decorator={<LoginIcon />} href={"/login"}>
      Login
    </MenuItemWithLink>
    <Separator />
    {!force_theme && <ThemeToggleItem />}
    <MenuItemWithLink
      decorator={<QuestionMarkIcon />}
      href={"mailto:support@storiny.com"}
    >
      Help
    </MenuItemWithLink>
  </Menu>
);

const Actions = ({
  is_transparent,
  force_theme
}: {
  force_theme?: boolean;
  is_transparent?: boolean;
}): React.ReactElement => {
  const logged_in = use_app_selector(select_is_logged_in);
  const auth_status = use_app_selector(select_auth_status);
  const user = use_app_selector(select_user);
  const blog = use_blog_context();

  return (
    <div
      className={clsx(
        css["flex-center"],
        styles.actions,
        is_transparent && styles.transparent
      )}
    >
      <IconButton
        aria-label={"Search"}
        className={styles.action}
        title={"Search"}
        variant={"ghost"}
      >
        <SearchIcon />
      </IconButton>
      <IconButton
        aria-label={"View archive"}
        as={NextLink}
        className={styles.action}
        href={"/archive"}
        title={"View archive"}
        variant={"ghost"}
      >
        <ArchiveIcon />
      </IconButton>
      {logged_in ? (
        ["idle", "loading", "error"].includes(auth_status) ? (
          <LoggedOutMenu
            force_theme={force_theme}
            trigger={
              <button
                aria-busy
                className={clsx(css["flex-center"], styles.trigger)}
              >
                {["idle", "loading"].includes(auth_status) ? (
                  <Skeleton height={32} shape={"circular"} width={32} />
                ) : (
                  <Avatar className={styles["error-avatar"]}>
                    <CloudOffIcon />
                  </Avatar>
                )}
              </button>
            }
          />
        ) : (
          <React.Fragment>
            {["owner", "editor"].includes(blog.role || "") && (
              <IconButton
                aria-label={"Blog settings"}
                as={NextLink}
                className={styles.action}
                href={`${process.env.NEXT_PUBLIC_WEB_URL}/blogs/${blog.id}`}
                title={"Blog settings"}
                variant={"ghost"}
              >
                <SettingsIcon />
              </IconButton>
            )}
            <LoggedInMenu
              force_theme={force_theme}
              trigger={
                <Avatar
                  alt={""}
                  aria-label={"Site and account options"}
                  as={"button"}
                  avatar_id={user?.avatar_id}
                  className={clsx(
                    css["focusable"],
                    css["flex-center"],
                    styles.trigger
                  )}
                  hex={user?.avatar_hex}
                  label={user?.name}
                  type={"button"}
                />
              }
              user={user}
            />
          </React.Fragment>
        )
      ) : (
        <LoggedOutMenu
          force_theme={force_theme}
          trigger={
            <IconButton
              aria-label={"User options"}
              className={styles.action}
              title={"More options"}
              variant={"ghost"}
            >
              <UserIcon />
            </IconButton>
          }
        />
      )}
    </div>
  );
};

export default Actions;
