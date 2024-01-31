"use client";

import clsx from "clsx";
import { Interweave, InterweaveProps, Node } from "interweave";
import NextLink from "next/link";
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
    case "a":
      if (
        typeof node.dataset.mention !== "undefined" ||
        typeof node.dataset.tag !== "undefined"
      ) {
        return (
          <Typography
            as={NextLink}
            className={clsx(node.className)}
            href={node.getAttribute("href") || "/"}
            level={
              typeof node.dataset.mention !== "undefined" ? "mention" : "tag"
            }
            target={"_blank"}
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
    // Convert paragraph to span elements to avoid nesting issues
    case "p":
      return <span {...node.attributes}>{children}</span>;
  }
};

const BioParser = ({
  content,
  ...rest
}: InterweaveProps): React.ReactElement => (
  <Interweave
    {...rest}
    allowList={["a", "b", "del", "em", "p"]}
    containerTagName={"div"}
    content={content}
    transform={transform}
  />
);

export default BioParser;
