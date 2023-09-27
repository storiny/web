"use client";

import { StoryCategory } from "@storiny/shared";
import { clsx } from "clsx";
import dynamic from "next/dynamic";
import React from "react";

import { dynamicLoader } from "~/common/dynamic";
import Input from "~/components/Input";
import Tab from "~/components/Tab";
import TabPanel from "~/components/TabPanel";
import Tabs from "~/components/Tabs";
import TabsList from "~/components/TabsList";
import { useDebounce } from "~/hooks/useDebounce";
import SearchIcon from "~/icons/Search";

import Dropdown from "./dropdown";
import StoryList from "./entities/story-list";
import TagsPreview from "./previews/tags";
import WritersPreview from "./previews/writers";
import styles from "./styles.module.scss";

const WriterList = dynamic(() => import("./entities/writer-list"), {
  loading: dynamicLoader()
});

const TagList = dynamic(() => import("./entities/tag-list"), {
  loading: dynamicLoader()
});

interface Props {
  category: StoryCategory | "all";
}

export type ExploreTabValue = "all" | "stories" | "writers" | "tags";

/**
 * Normalizes story category
 * @param category Story category
 */
const normalizeCategory = (category: Props["category"]): string =>
  category === "all"
    ? "all categories"
    : category === "diy"
    ? "DIY"
    : category.replace(/-/g, " ");

// Page header tabs

const PageTabsHeader = (): React.ReactElement => (
  <TabsList
    className={clsx("full-bleed", "page-header", styles.x, styles["tabs-list"])}
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
  onQueryChange,
  category,
  tabValue
}: {
  category: Props["category"];
  onQueryChange: (newQuery: string) => void;
  query: string;
  tabValue: ExploreTabValue;
}): React.ReactElement => (
  <div
    className={clsx(
      "flex-center",
      "full-bleed",
      "page-header",
      "with-page-title",
      styles.x,
      styles["page-title"]
    )}
  >
    <Input
      autoFocus
      decorator={<SearchIcon />}
      onChange={(event): void => onQueryChange(event.target.value)}
      placeholder={`Search ${
        tabValue === "all" ? "" : `for ${tabValue} `
      }in ${normalizeCategory(category)}`}
      size={"lg"}
      slot_props={{
        container: {
          className: clsx("f-grow", styles.x, styles.input)
        }
      }}
      type={"search"}
      value={query}
    />
    <Dropdown />
  </div>
);

const Client = ({ category }: Props): React.ReactElement => {
  const [value, setValue] = React.useState<ExploreTabValue>("all");
  const [query, setQuery] = React.useState<string>("");
  const debouncedQuery = useDebounce(query);
  const normalizedCategory = normalizeCategory(category);
  const isTyping = query !== debouncedQuery;

  const handleChange = (newValue: ExploreTabValue): void => {
    setQuery("");
    setValue(newValue);
  };

  const handleQueryChange = React.useCallback(
    (newQuery: string) => setQuery(newQuery),
    []
  );

  return (
    <Tabs
      className={clsx("flex-col", styles.x, styles.tabs)}
      onValueChange={handleChange}
      value={value}
    >
      <PageTabsHeader />
      <PageInputHeader
        category={category}
        onQueryChange={handleQueryChange}
        query={query}
        tabValue={value}
      />
      <TabPanel
        className={clsx("full-w", "flex-col")}
        style={{ marginTop: "-12px" }}
        value={"all"}
      >
        <WritersPreview
          category={category}
          debouncedQuery={debouncedQuery}
          loading={isTyping}
          normalizedCategory={normalizedCategory}
        />
        <TagsPreview
          category={category}
          debouncedQuery={debouncedQuery}
          loading={isTyping}
          normalizedCategory={normalizedCategory}
        />
        <StoryList
          category={category}
          debouncedQuery={debouncedQuery}
          loading={isTyping}
        />
      </TabPanel>
      <TabPanel
        className={clsx("full-w", "flex-col")}
        style={{ marginTop: "-12px" }}
        value={"stories"}
      >
        <StoryList
          category={category}
          debouncedQuery={debouncedQuery}
          loading={isTyping}
        />
      </TabPanel>
      <TabPanel
        className={clsx("full-w", "flex-col")}
        style={{ marginTop: "-12px" }}
        value={"writers"}
      >
        <WriterList
          category={category}
          debouncedQuery={debouncedQuery}
          loading={isTyping}
        />
      </TabPanel>
      <TabPanel
        className={clsx("full-w", "flex-col")}
        style={{ marginTop: "-12px" }}
        value={"tags"}
      >
        <TagList
          category={category}
          debouncedQuery={debouncedQuery}
          loading={isTyping}
        />
      </TabPanel>
    </Tabs>
  );
};

export default Client;
