"use client";

import clsx from "clsx";
import { Interweave, InterweaveProps, Node } from "interweave";
import React from "react";

import Link from "~/components/link";

/**
 * Node transformer
 * @param node HTML element
 * @param children Element children
 */
const transform = (node: HTMLElement, children: Node[]): React.ReactNode => {
  switch (node.tagName.toLowerCase()) {
    case "a":
      return (
        <Link
          className={clsx(node.className)}
          href={node.getAttribute("href") || "/"}
          style={{ color: "var(--fg-major)" }}
          underline={node.getAttribute("data-underline") ? "always" : "hover"}
        >
          {children}
        </Link>
      );
  }
};

const NotificationParser = ({
  content,
  ...rest
}: InterweaveProps): React.ReactElement => (
  <Interweave
    {...rest}
    allowList={["a", "b", "em", "p", "span", "div"]}
    content={content}
    transform={transform}
  />
);

export default NotificationParser;
