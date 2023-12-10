"use client";

import clsx from "clsx";
import { Interweave, InterweaveProps, Node } from "interweave";
import React from "react";

import css from "~/theme/main.module.scss";

/**
 * Node transformer
 * @param node HTML element
 * @param children Element children
 */
const transform = (node: HTMLElement, children: Node[]): React.ReactNode => {
  switch (node.tagName.toLowerCase()) {
    case "m":
      return (
        <span className={clsx(css["t-medium"], node.className)}>
          {children}
        </span>
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
    containerTagName={"div"}
    content={content}
    transform={transform}
  />
);

export default AccountActivityParser;
