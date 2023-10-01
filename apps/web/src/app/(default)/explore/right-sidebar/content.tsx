"use client";

import { StoryCategory } from "@storiny/shared";
import {
  CATEGORY_ICON_MAP,
  CATEGORY_LABEL_MAP
} from "@storiny/shared/src/constants/category-icon-map";
import { clsx } from "clsx";
import NextLink from "next/link";
import { useSelectedLayoutSegment as use_selected_layout_segment } from "next/navigation";
import React from "react";

import Separator from "~/components/separator";
import Tab, { TabProps } from "~/components/tab";
import Tabs from "~/components/tabs";
import TabsList from "~/components/tabs-list";
import { DefaultRightSidebarContent } from "~/layout/right-sidebar";

import { CATEGORIES } from "../categories";
import styles from "./right-sidebar.module.scss";

const AnchorTab = ({
  value,
  ...rest
}: Omit<TabProps, "value"> & {
  value: StoryCategory | "all";
}): React.ReactElement => (
  <Tab
    {...rest}
    aria-controls={undefined}
    aria-selected={undefined}
    as={NextLink}
    className={clsx(styles.x, styles.tab)}
    href={value === "all" ? "/explore" : `/explore/${value}`}
    id={value}
    role={undefined}
    value={value}
  />
);

const SuspendedExploreRightSidebarContent = (): React.ReactElement => {
  const segment = use_selected_layout_segment();
  return (
    <>
      <Tabs
        activationMode={"manual"}
        className={clsx(styles.x, styles.tabs)}
        defaultValue={segment || "all"}
        orientation={"vertical"}
        role={undefined}
      >
        <TabsList
          aria-orientation={undefined}
          as={"nav"}
          loop={false}
          role={undefined}
        >
          {CATEGORIES.map((category) => (
            <AnchorTab
              decorator={CATEGORY_ICON_MAP[category]}
              key={category}
              value={category}
            >
              {CATEGORY_LABEL_MAP[category]}
            </AnchorTab>
          ))}
        </TabsList>
      </Tabs>
      <Separator />
      <DefaultRightSidebarContent hide_popular_stories />
    </>
  );
};

export default SuspendedExploreRightSidebarContent;
