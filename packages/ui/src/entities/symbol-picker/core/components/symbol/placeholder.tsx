"use client";

import clsx from "clsx";
import React from "react";

import styles from "./symbol.module.scss";

const PlaceholderSymbol = (): React.ReactElement => (
  <span aria-hidden className={clsx(styles.placeholder)} />
);

export default PlaceholderSymbol;
