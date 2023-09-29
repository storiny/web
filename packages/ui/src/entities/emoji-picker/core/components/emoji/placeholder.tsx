"use client";

import clsx from "clsx";
import React from "react";

import styles from "./emoji.module.scss";

const PlaceholderEmoji = (): React.ReactElement => (
  <span aria-hidden className={clsx(styles.placeholder)} />
);

export default PlaceholderEmoji;
