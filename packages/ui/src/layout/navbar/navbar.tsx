"use client";

import clsx from "clsx";
import NextLink from "next/link";
import React from "react";

import Wordmark from "~/brand/wordmark";
import Input from "~/components/input";
import SearchIcon from "~/icons/Search";
import { select_is_logged_in } from "~/redux/features/auth/selectors";
import { use_app_selector } from "~/redux/hooks";

import Actions from "./actions";
import styles from "./navbar.module.scss";
import { NavbarProps } from "./navbar.props";

const Navbar = (props: NavbarProps): React.ReactElement => {
  const { variant = "default", className, children, ...rest } = props;
  const logged_in = use_app_selector(select_is_logged_in);
  return (
    <header
      {...rest}
      className={clsx(
        styles.navbar,
        logged_in && styles["logged-in"],
        variant === "minimal" && styles.minimal,
        className
      )}
      role={"banner"}
    >
      <nav
        className={clsx(
          "f-grow",
          styles.nav,
          variant === "minimal" && styles.minimal
        )}
      >
        <NextLink
          aria-label={"Homepage"}
          className={clsx(styles.wordmark, "focusable")}
          href={"/"}
          title={"Go to homepage"}
        >
          <Wordmark
            component_props={{
              label: { className: styles["wordmark-label"] },
              beta_label: { className: styles["wordmark-label"] }
            }}
            role={"presentation"}
            show_beta
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
              placeholder={"Search Storiny"}
              results={5}
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
