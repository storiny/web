"use client";

import clsx from "clsx";
import React from "react";
import { GroupedVirtuosoHandle } from "react-virtuoso";

import EmojiList from "../List";
import EmojiPickerTabs from "../Tabs";
import styles from "./Main.module.scss";

const Main = (): React.ReactElement => {
  const listRef = React.useRef<GroupedVirtuosoHandle>(null);
  return (
    <div className={clsx("flex", styles.main)}>
      <EmojiPickerTabs listRef={listRef} />
      <EmojiList ref={listRef} />
    </div>
  );
};

export default Main;
