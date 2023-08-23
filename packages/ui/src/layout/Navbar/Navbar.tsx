"use client";

import clsx from "clsx";
import NextLink from "next/link";
import React from "react";

import Wordmark from "~/brand/Wordmark";
import Input from "~/components/Input";
import SearchIcon from "~/icons/Search";
import { selectLoggedIn } from "~/redux/features/auth/selectors";
import { useAppSelector } from "~/redux/hooks";

import Actions from "./Actions";
import styles from "./Navbar.module.scss";
import { NavbarProps } from "./Navbar.props";

const Navbar = (props: NavbarProps): React.ReactElement => {
  const { variant = "default", className, children, ...rest } = props;
  const loggedIn = useAppSelector(selectLoggedIn);

  return (
    <header
      {...rest}
      className={clsx(
        styles.navbar,
        loggedIn && styles["logged-in"],
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
            componentProps={{
              label: { className: styles["wordmark-label"] },
              betaLabel: { className: styles["wordmark-label"] }
            }}
            role={"presentation"}
            showBeta
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
              slotProps={{
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
