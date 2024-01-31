/* eslint-disable no-case-declarations */

"use client";

import clsx from "clsx";
import { Interweave, InterweaveProps, Node } from "interweave";
import React from "react";

import Link from "~/components/link";
import UserHoverCard from "~/components/user-hover-card";
import css from "~/theme/main.module.scss";

/**
 * Predicate function for determining non-undefined values.
 * @param value The value to test.
 */
const is_defined = (value: unknown): boolean => typeof value !== "undefined";

/**
 * Node transformer
 * @param node HTML element
 * @param children Element children
 */
const transform = (node: HTMLElement, children: Node[]): React.ReactNode => {
  switch (node.tagName.toLowerCase()) {
    case "span":
      return (
        <span
          className={clsx(
            node.className,
            is_defined(node.dataset.fwBold)
              ? css["t-bold"]
              : is_defined(node.dataset.fwMedium)
                ? css["t-medium"]
                : null
          )}
        >
          {children}
        </span>
      );
    case "a":
      const component = (
        <Link
          className={clsx(
            node.className,
            is_defined(node.dataset.fwBold)
              ? css["t-bold"]
              : is_defined(node.dataset.fwMedium)
                ? css["t-medium"]
                : null
          )}
          href={node.getAttribute("href") || "/"}
          style={{ color: "var(--fg-major)" }}
          underline={is_defined(node.dataset.underline) ? "always" : "hover"}
        >
          {children}
        </Link>
      );

      if (is_defined(node.dataset.user)) {
        return (
          <UserHoverCard
            identifier={(node.getAttribute("href") || "/").replace("/", "")}
          >
            {component}
          </UserHoverCard>
        );
      }

      return component;
  }
};

const NotificationParser = ({
  content,
  ...rest
}: InterweaveProps): React.ReactElement => (
  <Interweave
    {...rest}
    allowList={["a", "b", "del", "em", "p", "span", "div"]}
    containerTagName={"div"}
    content={content}
    transform={transform}
  />
);

export default NotificationParser;
