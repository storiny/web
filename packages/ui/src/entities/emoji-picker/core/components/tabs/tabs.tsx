"use client";

import clsx from "clsx";
import { useAtom as use_atom, useAtomValue as use_atom_value } from "jotai";
import React from "react";
import Tab from "src/components/tab";
import Tabs from "src/components/tabs";
import TabsList from "src/components/tabs-list";

import BasketballIcon from "src/icons/basketball";
import BulbIcon from "src/icons/bulb";
import CupIcon from "src/icons/cup";
import MapIcon from "src/icons/map";
import MoodSmileIcon from "src/icons/mood-smile";
import PawIcon from "src/icons/paw";
import ReportIcon from "src/icons/report";
import SymbolsIcon from "src/icons/symbols";

import { emoji_category_atom, emoji_query_atom } from "../../atoms";
import { EmojiCategory } from "../../constants";
import styles from "./tabs.module.scss";
import { EmojiPickerTabsProps } from "./tabs.props";

const EmojiPickerTabs = (props: EmojiPickerTabsProps): React.ReactElement => {
  const { list_ref, ...rest } = props;
  const [value, set_value] = use_atom(emoji_category_atom);
  const query_value = use_atom_value(emoji_query_atom);
  const disabled = Boolean(query_value);

  /**
   * Scrolls to category
   * @param index Category index
   */
  const scroll_to_category = (index: number): void => {
    if (list_ref?.current?.scrollToIndex) {
      list_ref.current.scrollToIndex({
        groupIndex: index,
        behavior: "smooth",
        offset: 24
      });
    }
  };

  return (
    <Tabs
      {...rest}
      onValueChange={(next_value): void =>
        set_value(next_value as EmojiCategory)
      }
      orientation={"vertical"}
      value={value}
    >
      <TabsList className={clsx("full-h", styles["tabs-list"])}>
        <Tab
          aria-controls={undefined}
          className={styles.tab}
          decorator={<MoodSmileIcon />}
          disabled={disabled}
          onClick={(): void => scroll_to_category(0)}
          title={"Smileys & people"}
          value={EmojiCategory.SMILEYS_AND_PEOPLE}
        />
        <Tab
          aria-controls={undefined}
          className={styles.tab}
          decorator={<PawIcon />}
          disabled={disabled}
          onClick={(): void => scroll_to_category(1)}
          title={"Animals & nature"}
          value={EmojiCategory.ANIMALS_AND_NATURE}
        />
        <Tab
          aria-controls={undefined}
          className={styles.tab}
          decorator={<CupIcon />}
          disabled={disabled}
          onClick={(): void => scroll_to_category(2)}
          title={"Food & drink"}
          value={EmojiCategory.FOOD_AND_DRINK}
        />
        <Tab
          aria-controls={undefined}
          className={styles.tab}
          decorator={<BasketballIcon />}
          disabled={disabled}
          onClick={(): void => scroll_to_category(3)}
          title={"Activity"}
          value={EmojiCategory.ACTIVITY}
        />
        <Tab
          aria-controls={undefined}
          className={styles.tab}
          decorator={<MapIcon />}
          disabled={disabled}
          onClick={(): void => scroll_to_category(4)}
          title={"Travel & places"}
          value={EmojiCategory.TRAVEL_AND_PLACES}
        />
        <Tab
          aria-controls={undefined}
          className={styles.tab}
          decorator={<BulbIcon />}
          disabled={disabled}
          onClick={(): void => scroll_to_category(5)}
          title={"Objects"}
          value={EmojiCategory.OBJECTS}
        />
        <Tab
          aria-controls={undefined}
          className={styles.tab}
          decorator={<SymbolsIcon />}
          disabled={disabled}
          onClick={(): void => scroll_to_category(6)}
          title={"Symbols"}
          value={EmojiCategory.SYMBOLS}
        />
        <Tab
          aria-controls={undefined}
          className={styles.tab}
          decorator={<ReportIcon />}
          disabled={disabled}
          onClick={(): void => scroll_to_category(7)}
          title={"Flags"}
          value={EmojiCategory.FLAGS}
        />
      </TabsList>
    </Tabs>
  );
};

export default EmojiPickerTabs;
