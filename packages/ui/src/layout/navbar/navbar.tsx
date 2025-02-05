"use client";

import { use_app_router } from "@storiny/web/src/common/utils";
import clsx from "clsx";
import NextLink from "next/link";
import React from "react";

import Wordmark from "~/brand/wordmark";
import Input from "~/components/input";
import SearchIcon from "~/icons/search";
import { select_is_logged_in } from "~/redux/features/auth/selectors";
import { use_app_selector } from "~/redux/hooks";
import css from "~/theme/main.module.scss";

import Actions from "./actions";
import styles from "./navbar.module.scss";
import { NavbarProps } from "./navbar.props";

const Navbar = (props: NavbarProps): React.ReactElement => {
  const {
    variant = "default",
    is_dashboard,
    className,
    children,
    ...rest
  } = props;
  const router = use_app_router();
  const logged_in = use_app_selector(select_is_logged_in);

  return (
    <header
      {...rest}
      className={clsx(
        styles.navbar,
        logged_in && styles["logged-in"],
        variant === "minimal" && styles.minimal,
        is_dashboard && styles.dashboard,
        className
      )}
      data-global-header={"true"}
      role={"banner"}
    >
      <nav
        className={clsx(
          css["f-grow"],
          styles.nav,
          variant === "minimal" && styles.minimal
        )}
      >
        <NextLink
          aria-label={"Homepage"}
          className={clsx(styles.wordmark, css["focusable"])}
          href={"/"}
          title={"Go to homepage"}
        >
          <Wordmark
            component_props={{
              label: { className: styles["wordmark-label"] }
            }}
            role={"presentation"}
            size={"sm"}
          />
        </NextLink>
        {variant === "minimal" && children ? (
          <span aria-hidden={"true"} className={styles.child}>
            {children}
          </span>
        ) : null}
        {variant === "default" && (
          <>
            <Input
              decorator={<SearchIcon />}
              name={"navbar-search"}
              onKeyUp={(event): void => {
                if (event.key === "Enter") {
                  router.push(
                    `/explore?query=${event.currentTarget.value || ""}`
                  );
                }
              }}
              placeholder={"Search Storiny"}
              slot_props={{
                container: { className: styles.search }
              }}
              type={"search"}
            />
            <Actions />
          </>
        )}
      </nav>
    </header>
  );
};

export default Navbar;
