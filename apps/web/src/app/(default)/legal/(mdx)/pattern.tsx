"use client";

import { clsx } from "clsx";
import React from "react";

import DateTime from "~/components/date-time";
import Typography from "~/components/typography";
import css from "~/theme/main.module.scss";

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
    <div className={clsx(css["flex-col"], styles.header)}>
      <Typography level={"h1"}>{meta.title}</Typography>
      <Typography className={clsx(css["t-medium"], css["t-minor"])}>
        Last updated: <DateTime date={meta.last_updated} />
      </Typography>
    </div>
    <div className={clsx(css["flex-col"], styles.content)}>{children}</div>
  </MarkdownProvider>
);

export default MDXPattern;
