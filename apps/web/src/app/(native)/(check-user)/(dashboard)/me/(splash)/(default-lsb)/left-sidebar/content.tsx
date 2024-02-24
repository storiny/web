"use client";

import clsx from "clsx";
import NextLink from "next/link";
import { useSelectedLayoutSegments as use_selected_layout_segments } from "next/navigation";
import React from "react";

import Input from "~/components/input";
import ScrollArea from "~/components/scroll-area";
import Separator from "~/components/separator";
import Spacer from "~/components/spacer";
import Tab, { TabProps } from "~/components/tab";
import Tabs from "~/components/tabs";
import TabsList from "~/components/tabs-list";
import Typography from "~/components/typography";
import Persona from "~/entities/persona";
import SearchIcon from "~/icons/search";
import { select_user } from "~/redux/features";
import { use_app_selector } from "~/redux/hooks";
import css from "~/theme/main.module.scss";
import { capitalize } from "~/utils/capitalize";

import {
  DASHBOARD_GROUPS,
  Group,
  search_dashboard_groups
} from "../../../groups";
import { DashboardSegment } from "../../../types";
import styles from "./left-sidebar.module.scss";

const APP_STATUS = process.env.NEXT_PUBLIC_APP_STATUS;
const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION;
const APP_BUILD_HASH = process.env.NEXT_PUBLIC_BUILD_HASH;

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
  <div className={clsx(css["flex-col"], styles["tabs-group"])}>
    <Typography
      className={clsx(css["t-medium"], css["t-minor"])}
      level={"body2"}
    >
      {group.title}
    </Typography>
    <div className={clsx(css["flex-col"], styles["tabs-group-container"])}>
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
  const [query, set_query] = React.useState<string>("");
  const [results, set_results] = React.useState<Group[]>([]);
  const segments = use_selected_layout_segments();
  const user = use_app_selector(select_user)!;

  const current_segment = React.useMemo(() => {
    const next_segments = segments;

    // Remove (default-rsb) layout chunk
    const index = next_segments.indexOf("(default-rsb)");

    if (index > -1) {
      next_segments.splice(index, 1);
    }

    return next_segments.join("/");
  }, [segments]);

  React.useEffect(() => {
    // Scroll selected segment tab into view on mount
    const current_segment_element = document.getElementById(current_segment);
    if (current_segment_element) {
      current_segment_element.scrollIntoView({
        block: "center",
        behavior: "smooth"
      });
    }
  }, [current_segment]);

  return (
    <div className={clsx(css["flex-col"], styles["left-sidebar"])}>
      <div className={clsx(css["flex-col"], styles.content)}>
        <Persona
          avatar={{
            alt: `${user.name}'s avatar`,
            avatar_id: user.avatar_id,
            label: user.name,
            hex: user.avatar_hex
          }}
          className={clsx(styles.x, styles.persona)}
          component_props={{
            primary_text: {
              className: css["ellipsis"]
            },
            secondary_text: {
              className: css["ellipsis"]
            }
          }}
          primary_text={user.name}
          secondary_text={`@${user.username}`}
          size={"lg"}
        />
        <Input
          decorator={<SearchIcon />}
          onChange={(event): void => {
            const value = event.target.value;
            set_query(value);
            search_dashboard_groups(value).then(set_results);
          }}
          placeholder={"Search settings"}
          type={"search"}
          value={query}
        />
        <Separator />
      </div>
      <ScrollArea
        className={clsx(styles.x, styles.scroller)}
        slot_props={{
          viewport: {
            tabIndex: -1,
            className: clsx(css["flex"], styles.x, styles.viewport)
          },
          scrollbar: {
            // eslint-disable-next-line prefer-snakecase/prefer-snakecase
            style: { zIndex: 1, backgroundColor: "transparent" }
          }
        }}
      >
        <Tabs
          activationMode={"manual"}
          className={clsx(css["full-w"], css["fit-h"])}
          orientation={"vertical"}
          role={undefined}
          value={current_segment}
        >
          <TabsList
            aria-orientation={undefined}
            as={"nav"}
            className={clsx(css["full-w"], styles.x, styles["tabs-list"])}
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
                    css["t-center"],
                    css["t-minor"],
                    styles.x,
                    styles.content
                  )}
                  level={"body2"}
                >
                  Could not find anything for &quot;
                  <span
                    className={css["t-medium"]}
                    style={{ wordBreak: "break-all" }}
                  >
                    {query}
                  </span>
                  &quot;
                </Typography>
              )
            ) : (
              DASHBOARD_GROUPS.map((group) => (
                <GroupComponent group={group} key={group.title} />
              ))
            )}
          </TabsList>
        </Tabs>
        <Spacer orientation={"vertical"} size={2} />
        <div className={clsx(css["flex-col"], styles.content, styles.footer)}>
          <Separator />
          <div className={css["flex-col"]}>
            <Typography className={css["t-muted"]} ellipsis level={"body3"}>
              {capitalize(APP_STATUS || "")} {APP_VERSION}
              {APP_BUILD_HASH ? ` (${APP_BUILD_HASH})` : ""}
            </Typography>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default SuspendedDashboardLeftSidebarContent;
