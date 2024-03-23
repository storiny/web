"use client";

import clsx from "clsx";
import { Interweave, InterweaveProps, Node } from "interweave";
import React from "react";

import Link from "~/components/link";
import Typography from "~/components/typography";

/**
 * Node transformer
 * @param node HTML element
 * @param children Element children
 */
const transform = (node: HTMLElement, children: Node[]): React.ReactNode => {
  switch (node.tagName.toLowerCase()) {
    case "code":
      return (
        <Typography className={clsx(node.className)} level={"inline-code"}>
          {children}
        </Typography>
      );
    case "a":
      if (
        typeof node.dataset.mention !== "undefined" ||
        typeof node.dataset.tag !== "undefined"
      ) {
        return (
          <Typography
            className={clsx(node.className)}
            level={
              typeof node.dataset.mention !== "undefined" ? "mention" : "tag"
            }
          >
            {children}
          </Typography>
        );
      }

      return (
        <Link
          className={clsx(node.className)}
          href={node.getAttribute("href") || "/"}
          target={"_blank"}
          underline={"always"}
        >
          {children}
        </Link>
      );
  }
};

const ResponseParser = ({
  content,
  ...rest
}: InterweaveProps): React.ReactElement => (
  <Interweave
    {...rest}
    allowList={["a", "b", "del", "em", "p", "code", "strong"]}
    containerTagName={"div"}
    content={content}
    transform={transform}
  />
);

export default ResponseParser;
