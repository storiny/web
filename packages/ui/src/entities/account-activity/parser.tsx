"use client";

import clsx from "clsx";
import { Interweave, InterweaveProps, Node } from "interweave";
import React from "react";

/**
 * Node transformer
 * @param node HTML element
 * @param children Element children
 */
const transform = (node: HTMLElement, children: Node[]): React.ReactNode => {
  switch (node.tagName.toLowerCase()) {
    case "m":
      return (
        <span className={clsx("t-medium", node.className)}>{children}</span>
      );
  }
};

const AccountActivityParser = ({
  content,
  ...rest
}: InterweaveProps): React.ReactElement => (
  <Interweave
    {...rest}
    allowList={["m"]}
    content={content}
    transform={transform}
  />
);

export default AccountActivityParser;
