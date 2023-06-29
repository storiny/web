"use client";

import { clsx } from "clsx";
import React from "react";

import Typography from "~/components/Typography";
import { DateFormat, formatDate } from "~/utils/formatDate";

import MarkdownProvider from "../../../../mdx-provider";
import styles from "./pattern.module.scss";

interface Props {
  children: React.ReactNode;
  meta: {
    lastUpdated: string;
    title: string;
  };
}

const MDXPattern = ({ meta, children }: Props): React.ReactElement => (
  <MarkdownProvider>
    <div className={clsx("flex-col", styles.header)}>
      <Typography level={"h1"}>{meta.title}</Typography>
      <Typography className={"t-medium"}>
        Effective as of:{" "}
        {formatDate(new Date(meta.lastUpdated), DateFormat.STANDARD)}
      </Typography>
    </div>
    <div className={clsx("flex-col", styles.content)}>{children}</div>
  </MarkdownProvider>
);

export default MDXPattern;
