"use client";

import { StoryCategory } from "@storiny/shared";
import { clsx } from "clsx";
import NextLink from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import React from "react";

import Separator from "~/components/Separator";
import Tab, { TabProps } from "~/components/Tab";
import Tabs from "~/components/Tabs";
import TabsList from "~/components/TabsList";
import { DefaultRightSidebarContent } from "~/layout/RightSidebar";

import { categories } from "../categories";
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
  const segment = useSelectedLayoutSegment();
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
          {categories.map(({ id, title, Icon }) => (
            <AnchorTab decorator={<Icon />} key={id} value={id}>
              {title}
            </AnchorTab>
          ))}
        </TabsList>
      </Tabs>
      <Separator />
      <DefaultRightSidebarContent hidePopularStories />
    </>
  );
};

export default SuspendedExploreRightSidebarContent;
