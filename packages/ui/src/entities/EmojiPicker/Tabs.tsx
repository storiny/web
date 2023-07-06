import clsx from "clsx";
import { useAtom } from "jotai";
import React from "react";

import Tab from "~/components/Tab";
import Tabs from "~/components/Tabs";
import TabsList from "~/components/TabsList";
import { emojiCategoryAtom } from "~/entities/EmojiPicker/core/atoms";
import { EmojiCategory } from "~/entities/EmojiPicker/core/constants";
import styles from "~/entities/EmojiPicker/EmojiPicker.module.scss";
import BasketballIcon from "~/icons/Basketball";
import BulbIcon from "~/icons/Bulb";
import CupIcon from "~/icons/Cup";
import MapIcon from "~/icons/Map";
import MoodSmileIcon from "~/icons/MoodSmile";
import PawIcon from "~/icons/Paw";
import ReportIcon from "~/icons/Report";
import SymbolsIcon from "~/icons/Symbols";

const EmojiPickerTabs = (): React.ReactElement => {
  const [value, setValue] = useAtom(emojiCategoryAtom);
  return (
    <Tabs
      onValueChange={(newValue): void => setValue(newValue as EmojiCategory)}
      orientation={"vertical"}
      value={value}
    >
      <TabsList className={clsx("full-h", styles["tabs-list"])}>
        <Tab
          className={styles.tab}
          decorator={<MoodSmileIcon />}
          title={"Smileys & people"}
          value={EmojiCategory.SMILEYS_AND_PEOPLE}
        />
        <Tab
          className={styles.tab}
          decorator={<PawIcon />}
          title={"Animals & nature"}
          value={EmojiCategory.ANIMALS_AND_NATURE}
        />
        <Tab
          className={styles.tab}
          decorator={<CupIcon />}
          title={"Food & drink"}
          value={EmojiCategory.FOOD_AND_DRINK}
        />
        <Tab
          className={styles.tab}
          decorator={<BasketballIcon />}
          title={"Activity"}
          value={EmojiCategory.ACTIVITY}
        />
        <Tab
          className={styles.tab}
          decorator={<MapIcon />}
          title={"Travel & places"}
          value={EmojiCategory.TRAVEL_AND_PLACES}
        />
        <Tab
          className={styles.tab}
          decorator={<BulbIcon />}
          title={"Objects"}
          value={EmojiCategory.OBJECTS}
        />
        <Tab
          className={styles.tab}
          decorator={<SymbolsIcon />}
          title={"Symbols"}
          value={EmojiCategory.SYMBOLS}
        />
        <Tab
          className={styles.tab}
          decorator={<ReportIcon />}
          title={"Flags"}
          value={EmojiCategory.FLAGS}
        />
      </TabsList>
    </Tabs>
  );
};

export default EmojiPickerTabs;
