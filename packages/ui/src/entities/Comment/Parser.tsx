"use client";

import clsx from "clsx";
import { Interweave, InterweaveProps, Node } from "interweave";
import React from "react";

import Link from "~/components/Link";

interface Props extends InterweaveProps {}

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
          underline={"always"}
        >
          {children}
        </Link>
      );
  }
};

const CommentParser = ({ content, ...rest }: Props): React.ReactElement => (
  <Interweave
    {...rest}
    allowList={["a", "b", "em", "p"]}
    content={content}
    transform={transform}
  />
);

export default CommentParser;
