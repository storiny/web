"use client";

import clsx from "clsx";
import { Interweave, InterweaveProps, Node } from "interweave";
import React from "react";

import Link from "~/components/link";
import Typography from "~/components/typography";

/**
 * Returns the node transformer
 * @param disable_hovercards Whether to disable hovercards
 */
const get_transformer =
  (disable_hovercards?: boolean) =>
  // eslint-disable-next-line react/display-name
  (node: HTMLElement, children: Node[]): React.ReactNode => {
    switch (node.tagName.toLowerCase()) {
      case "a":
        if (
          typeof node.dataset.mention !== "undefined" ||
          typeof node.dataset.tag !== "undefined"
        ) {
          return (
            <Typography
              className={clsx(node.className)}
              disable_hovercards={disable_hovercards}
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
      // Convert paragraph to span elements to avoid nesting issues
      case "p":
        return <span {...node.attributes}>{children}</span>;
    }
  };

const BioParser = ({
  content,
  disable_hovercards,
  ...rest
}: InterweaveProps & { disable_hovercards?: boolean }): React.ReactElement => (
  <Interweave
    {...rest}
    allowList={["a", "b", "del", "em", "p", "strong"]}
    containerTagName={"div"}
    content={content}
    transform={get_transformer(disable_hovercards)}
  />
);

export default BioParser;
