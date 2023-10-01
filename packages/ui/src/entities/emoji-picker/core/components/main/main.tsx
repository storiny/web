"use client";

import clsx from "clsx";
import React from "react";
import { GroupedVirtuosoHandle } from "react-virtuoso";

import css from "~/theme/main.module.scss";

import EmojiList from "../list";
import EmojiPickerTabs from "../tabs";
import styles from "./main.module.scss";

const Main = (): React.ReactElement => {
  const list_ref = React.useRef<GroupedVirtuosoHandle>(null);
  return (
    <div className={clsx(css["flex"], styles.main)}>
      <EmojiPickerTabs list_ref={list_ref} />
      <EmojiList ref={list_ref} />
    </div>
  );
};

export default Main;
