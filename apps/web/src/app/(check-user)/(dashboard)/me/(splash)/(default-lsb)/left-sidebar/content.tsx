"use client";

import clsx from "clsx";
import getConfig from "next/config";
import NextLink from "next/link";
import { useSelectedLayoutSegments } from "next/navigation";
import React from "react";

import Input from "~/components/Input";
import ScrollArea from "~/components/ScrollArea";
import Separator from "~/components/Separator";
import Spacer from "~/components/Spacer";
import Tab, { TabProps } from "~/components/Tab";
import Tabs from "~/components/Tabs";
import TabsList from "~/components/TabsList";
import Typography from "~/components/Typography";
import Persona from "~/entities/Persona";
import SearchIcon from "~/icons/Search";
import { selectUser } from "~/redux/features";
import { useAppSelector } from "~/redux/hooks";

import { dashboardGroups, Group, searchDashboardGroups } from "../../../groups";
import { DashboardSegment } from "../../../types";
import styles from "./left-sidebar.module.scss";

const { publicRuntimeConfig } = getConfig();

const appStatus = process.env.NEXT_PUBLIC_APP_STATUS; // Stable / beta
const appVersion = publicRuntimeConfig?.version;
const appBuildHash = publicRuntimeConfig?.buildHash;

/**
 * Returns formatted the app version
 */
const getVersion = (): string => {
  const parts = (appVersion || "").split(".");
  parts.pop(); // Remove patch version
  return parts.join(".");
};

// Anchor tab

const AnchorTab = ({
  value,
  ...rest
}: Omit<TabProps, "value"> & {
  value: DashboardSegment;
}): React.ReactElement => (
  <Tab
    {...rest}
    aria-controls={undefined}
    aria-selected={undefined}
    as={NextLink}
    className={clsx(styles.x, styles.tab)}
    href={`/me/${value}`}
    id={value}
    role={undefined}
    value={value}
  />
);

// Group component

const GroupComponent = ({ group }: { group: Group }): React.ReactElement => (
  <div className={clsx("flex-col", styles.x, styles["tabs-group"])}>
    <Typography className={clsx("t-medium", "t-minor")} level={"body2"}>
      {group.title}
    </Typography>
    <div className={clsx("flex-col", styles.x, styles["tabs-group-container"])}>
      {group.items.map((item) => (
        <AnchorTab
          decorator={item.decorator}
          key={item.value}
          value={item.value}
        >
          {item.title}
        </AnchorTab>
      ))}
    </div>
  </div>
);

const SuspendedDashboardLeftSidebarContent = (): React.ReactElement => {
  const [query, setQuery] = React.useState<string>("");
  const [results, setResults] = React.useState<Group[]>([]);
  const segments = useSelectedLayoutSegments();
  const user = useAppSelector(selectUser)!;
  segments.shift(); // Remove (mdx) layout
  const currentSegment = segments.join("/");

  React.useEffect(() => {
    // Scroll selected segment tab into view on mount
    const currentSegmentElement = document.getElementById(currentSegment);
    if (currentSegmentElement) {
      currentSegmentElement.scrollIntoView({
        block: "center",
        behavior: "smooth"
      });
    }
  }, [currentSegment]);

  return (
    <div className={clsx("flex-col", styles.x, styles["left-sidebar"])}>
      <div className={clsx("flex-col", styles.x, styles.content)}>
        <Persona
          avatar={{
            alt: `${user.name}'s avatar`,
            avatarId: user.avatar_id,
            label: user.name,
            hex: user.avatar_hex
          }}
          className={clsx(styles.x, styles.persona)}
          componentProps={{
            primaryText: {
              className: "ellipsis"
            },
            secondaryText: {
              className: "ellipsis"
            }
          }}
          primaryText={user.name}
          secondaryText={`@${user.username}`}
          size={"lg"}
        />
        <Input
          decorator={<SearchIcon />}
          onChange={(event): void => {
            const value = event.target.value;
            setQuery(value);
            searchDashboardGroups(value).then(setResults);
          }}
          placeholder={"Search settings"}
          type={"search"}
          value={query}
        />
        <Separator />
      </div>
      <ScrollArea
        className={clsx(styles.x, styles.scroller)}
        slotProps={{
          viewport: {
            tabIndex: -1,
            className: clsx("flex", styles.x, styles.viewport)
          },
          scrollbar: {
            style: { zIndex: 1, backgroundColor: "transparent" }
          }
        }}
      >
        <Tabs
          activationMode={"manual"}
          className={clsx("full-w", "fit-h")}
          orientation={"vertical"}
          role={undefined}
          value={currentSegment}
        >
          <TabsList
            aria-orientation={undefined}
            as={"nav"}
            className={clsx("full-w", styles.x, styles["tabs-list"])}
            loop={false}
            role={undefined}
          >
            {query ? (
              results.length ? (
                results.map((group) => (
                  <GroupComponent group={group} key={group.title} />
                ))
              ) : (
                <Typography
                  className={clsx(
                    "t-center",
                    "t-minor",
                    styles.x,
                    styles.content
                  )}
                  level={"body2"}
                >
                  Could not find anything for &quot;
                  <span
                    className={"t-medium"}
                    style={{ wordBreak: "break-all" }}
                  >
                    {query}
                  </span>
                  &quot;
                </Typography>
              )
            ) : (
              dashboardGroups.map((group) => (
                <GroupComponent group={group} key={group.title} />
              ))
            )}
          </TabsList>
        </Tabs>
        <Spacer orientation={"vertical"} size={2} />
        <div
          className={clsx("flex-col", styles.x, styles.content, styles.footer)}
        >
          <Separator />
          <div className={"flex-col"}>
            <Typography className={"t-muted"} ellipsis level={"body3"}>
              {process.env.NODE_ENV === "development" ? "Dev" : appStatus}{" "}
              {getVersion()}
              {appBuildHash ? ` (${appBuildHash})` : ""}
            </Typography>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default SuspendedDashboardLeftSidebarContent;
