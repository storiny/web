"use client";

import clsx from "clsx";
import { useAtom, useAtomValue } from "jotai";
import React from "react";

import Tab from "~/components/Tab";
import Tabs from "~/components/Tabs";
import TabsList from "~/components/TabsList";
import BasketballIcon from "~/icons/Basketball";
import BulbIcon from "~/icons/Bulb";
import CupIcon from "~/icons/Cup";
import MapIcon from "~/icons/Map";
import MoodSmileIcon from "~/icons/MoodSmile";
import PawIcon from "~/icons/Paw";
import ReportIcon from "~/icons/Report";
import SymbolsIcon from "~/icons/Symbols";

import { emojiCategoryAtom, queryAtom } from "../../atoms";
import { EmojiCategory } from "../../constants";
import styles from "./Tabs.module.scss";
import { EmojiPickerTabsProps } from "./Tabs.props";

const EmojiPickerTabs = (props: EmojiPickerTabsProps): React.ReactElement => {
  const { listRef, ...rest } = props;
  const [value, setValue] = useAtom(emojiCategoryAtom);
  const queryValue = useAtomValue(queryAtom);
  const disabled = Boolean(queryValue);

  /**
   * Scrolls to category
   * @param index Category index
   */
  const scrollToCategory = (index: number): void => {
    if (listRef?.current?.scrollToIndex) {
      listRef.current.scrollToIndex({
        groupIndex: index,
        behavior: "smooth",
        offset: 24
      });
    }
  };

  return (
    <Tabs
      {...rest}
      onValueChange={(newValue): void => setValue(newValue as EmojiCategory)}
      orientation={"vertical"}
      value={value}
    >
      <TabsList className={clsx("full-h", styles["tabs-list"])}>
        <Tab
          aria-controls={undefined}
          className={styles.tab}
          decorator={<MoodSmileIcon />}
          disabled={disabled}
          onClick={(): void => scrollToCategory(0)}
          title={"Smileys & people"}
          value={EmojiCategory.SMILEYS_AND_PEOPLE}
        />
        <Tab
          aria-controls={undefined}
          className={styles.tab}
          decorator={<PawIcon />}
          disabled={disabled}
          onClick={(): void => scrollToCategory(1)}
          title={"Animals & nature"}
          value={EmojiCategory.ANIMALS_AND_NATURE}
        />
        <Tab
          aria-controls={undefined}
          className={styles.tab}
          decorator={<CupIcon />}
          disabled={disabled}
          onClick={(): void => scrollToCategory(2)}
          title={"Food & drink"}
          value={EmojiCategory.FOOD_AND_DRINK}
        />
        <Tab
          aria-controls={undefined}
          className={styles.tab}
          decorator={<BasketballIcon />}
          disabled={disabled}
          onClick={(): void => scrollToCategory(3)}
          title={"Activity"}
          value={EmojiCategory.ACTIVITY}
        />
        <Tab
          aria-controls={undefined}
          className={styles.tab}
          decorator={<MapIcon />}
          disabled={disabled}
          onClick={(): void => scrollToCategory(4)}
          title={"Travel & places"}
          value={EmojiCategory.TRAVEL_AND_PLACES}
        />
        <Tab
          aria-controls={undefined}
          className={styles.tab}
          decorator={<BulbIcon />}
          disabled={disabled}
          onClick={(): void => scrollToCategory(5)}
          title={"Objects"}
          value={EmojiCategory.OBJECTS}
        />
        <Tab
          aria-controls={undefined}
          className={styles.tab}
          decorator={<SymbolsIcon />}
          disabled={disabled}
          onClick={(): void => scrollToCategory(6)}
          title={"Symbols"}
          value={EmojiCategory.SYMBOLS}
        />
        <Tab
          aria-controls={undefined}
          className={styles.tab}
          decorator={<ReportIcon />}
          disabled={disabled}
          onClick={(): void => scrollToCategory(7)}
          title={"Flags"}
          value={EmojiCategory.FLAGS}
        />
      </TabsList>
    </Tabs>
  );
};

export default EmojiPickerTabs;
