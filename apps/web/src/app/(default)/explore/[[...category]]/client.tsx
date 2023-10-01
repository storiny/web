"use client";

import { StoryCategory } from "@storiny/shared";
import { clsx } from "clsx";
import dynamic from "next/dynamic";
import React from "react";

import { dynamic_loader } from "~/common/dynamic";
import Input from "~/components/input";
import Tab from "~/components/tab";
import TabPanel from "~/components/tab-panel";
import Tabs from "~/components/tabs";
import TabsList from "~/components/tabs-list";
import { use_debounce } from "~/hooks/use-debounce";
import SearchIcon from "~/icons/search";
import css from "~/theme/main.module.scss";

import Dropdown from "./dropdown";
import StoryList from "./entities/story-list";
import TagsPreview from "./previews/tags";
import WritersPreview from "./previews/writers";
import styles from "./styles.module.scss";

const WriterList = dynamic(() => import("./entities/writer-list"), {
  loading: dynamic_loader()
});
const TagList = dynamic(() => import("./entities/tag-list"), {
  loading: dynamic_loader()
});

interface Props {
  category: StoryCategory | "all";
}

export type ExploreTabValue = "all" | "stories" | "writers" | "tags";

/**
 * Normalizes story category
 * @param category Story category
 */
const normalize_category = (category: Props["category"]): string =>
  category === "all"
    ? "all categories"
    : category === "diy"
    ? "DIY"
    : category.replace(/-/g, " ");

// Page header tabs

const PageTabsHeader = (): React.ReactElement => (
  <TabsList
    className={clsx(
      css["full-bleed"],
      css["page-header"],
      styles.x,
      styles["tabs-list"]
    )}
  >
    <Tab value={"all"}>All</Tab>
    <Tab value={"stories"}>Stories</Tab>
    <Tab value={"writers"}>Writers</Tab>
    <Tab value={"tags"}>Tags</Tab>
  </TabsList>
);

// Page header with input

const PageInputHeader = ({
  query,
  on_query_change,
  category,
  tab_value
}: {
  category: Props["category"];
  on_query_change: (next_query: string) => void;
  query: string;
  tab_value: ExploreTabValue;
}): React.ReactElement => (
  <div
    className={clsx(
      css["flex-center"],
      css["full-bleed"],
      css["page-header"],
      css["with-page-title"],
      styles["page-title"]
    )}
  >
    <Input
      autoFocus
      decorator={<SearchIcon />}
      onChange={(event): void => on_query_change(event.target.value)}
      placeholder={`Search ${
        tab_value === "all" ? "" : `for ${tab_value} `
      }in ${normalize_category(category)}`}
      size={"lg"}
      type={"search"}
      value={query}
    />
    <Dropdown />
  </div>
);

const Client = ({ category }: Props): React.ReactElement => {
  const [value, set_value] = React.useState<ExploreTabValue>("all");
  const [query, set_query] = React.useState<string>("");
  const debounced_query = use_debounce(query);
  const normalized_category = normalize_category(category);
  const is_typing = query !== debounced_query;

  const handle_change = (next_value: ExploreTabValue): void => {
    set_query("");
    set_value(next_value);
  };

  const handle_query_change = React.useCallback(
    (next_query: string) => set_query(next_query),
    []
  );

  return (
    <Tabs
      className={clsx(css["flex-col"], styles.x, styles.tabs)}
      onValueChange={handle_change}
      value={value}
    >
      <PageTabsHeader />
      <PageInputHeader
        category={category}
        on_query_change={handle_query_change}
        query={query}
        tab_value={value}
      />
      <TabPanel
        className={clsx(css["full-w"], css["flex-col"])}
        style={{ marginTop: "-12px" }}
        value={"all"}
      >
        <WritersPreview
          category={category}
          debounced_query={debounced_query}
          loading={is_typing}
          normalized_category={normalized_category}
        />
        <TagsPreview
          category={category}
          debounced_query={debounced_query}
          loading={is_typing}
          normalized_category={normalized_category}
        />
        <StoryList
          category={category}
          debounced_query={debounced_query}
          loading={is_typing}
        />
      </TabPanel>
      <TabPanel
        className={clsx(css["full-w"], css["flex-col"])}
        style={{ marginTop: "-12px" }}
        value={"stories"}
      >
        <StoryList
          category={category}
          debounced_query={debounced_query}
          loading={is_typing}
        />
      </TabPanel>
      <TabPanel
        className={clsx(css["full-w"], css["flex-col"])}
        style={{ marginTop: "-12px" }}
        value={"writers"}
      >
        <WriterList
          category={category}
          debounced_query={debounced_query}
          loading={is_typing}
        />
      </TabPanel>
      <TabPanel
        className={clsx(css["full-w"], css["flex-col"])}
        style={{ marginTop: "-12px" }}
        value={"tags"}
      >
        <TagList
          category={category}
          debounced_query={debounced_query}
          loading={is_typing}
        />
      </TabPanel>
    </Tabs>
  );
};

export default Client;
