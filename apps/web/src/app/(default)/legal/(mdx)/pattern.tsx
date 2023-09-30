"use client";

import { clsx } from "clsx";
import React from "react";

import Typography from "../../../../../../../packages/ui/src/components/typography";
import {
  DateFormat,
  format_date
} from "../../../../../../../packages/ui/src/utils/format-date";

import MarkdownProvider from "../../../../mdx-provider";
import styles from "./pattern.module.scss";

interface Props {
  children: React.ReactNode;
  meta: {
    last_updated: string;
    title: string;
  };
}

const MDXPattern = ({ meta, children }: Props): React.ReactElement => (
  <MarkdownProvider>
    <div className={clsx("flex-col", styles.header)}>
      <Typography level={"h1"}>{meta.title}</Typography>
      <Typography className={clsx("t-medium", "t-minor")}>
        Last updated:{" "}
        {format_date(new Date(meta.last_updated), DateFormat.STANDARD)}
      </Typography>
    </div>
    <div className={clsx("flex-col", styles.content)}>{children}</div>
  </MarkdownProvider>
);

export default MDXPattern;
