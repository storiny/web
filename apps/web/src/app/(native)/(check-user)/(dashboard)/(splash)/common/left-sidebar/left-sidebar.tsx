// Anchor tab

import clsx from "clsx";
import NextLink from "next/link";
import React from "react";

import Separator from "~/components/separator";
import Tab, { TabProps } from "~/components/tab";
import Typography from "~/components/typography";
import css from "~/theme/main.module.scss";
import { capitalize } from "~/utils/capitalize";

import { BlogDashboardSegment } from "../../blogs/[identifier]/types";
import { DashboardSegment } from "../../me/types";
import styles from "./left-sidebar.module.scss";

export type Group<T extends DashboardSegment | BlogDashboardSegment> = {
  items: {
    decorator: React.ReactElement;
    metadata?: Record<string, any>;
    title: string;
    value: T;
  }[];
  title: string;
};

const APP_STATUS = process.env.NEXT_PUBLIC_APP_STATUS;
const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION;
const APP_BUILD_HASH = process.env.NEXT_PUBLIC_BUILD_HASH;

export const AnchorTab = <T extends DashboardSegment | BlogDashboardSegment>({
  value,
  href_prefix,
  ...rest
}: Omit<TabProps, "value"> & {
  href_prefix: string;
  value: T;
}): React.ReactElement => (
  <Tab
    {...rest}
    aria-controls={undefined}
    aria-selected={undefined}
    as={NextLink}
    className={clsx(styles.x, styles.tab)}
    href={`/${href_prefix}/${value}`}
    id={value}
    role={undefined}
    value={value}
  />
);

export const GroupComponent = <
  T extends DashboardSegment | BlogDashboardSegment
>({
  group,
  href_prefix,
  should_render = (): boolean => true
}: {
  group: Group<T>;
  href_prefix: string;
  should_render?: (item: Group<T>["items"][number]) => boolean;
}): React.ReactElement => (
  <div className={clsx(css["flex-col"], styles["tabs-group"])}>
    <Typography color={"minor"} level={"body2"} weight={"medium"}>
      {group.title}
    </Typography>
    <div className={clsx(css["flex-col"], styles["tabs-group-container"])}>
      {group.items.map((item) =>
        should_render(item) ? (
          <AnchorTab<T>
            decorator={item.decorator}
            href_prefix={href_prefix}
            key={item.value}
            value={item.value}
          >
            {item.title}
          </AnchorTab>
        ) : null
      )}
    </div>
  </div>
);

export const LeftSidebarFooter = (): React.ReactElement => (
  <div className={clsx(css["flex-col"], styles.content, styles.footer)}>
    <Separator />
    <div className={css["flex-col"]}>
      <Typography color={"muted"} ellipsis level={"body3"}>
        {capitalize(APP_STATUS || "")} {APP_VERSION}
        {APP_BUILD_HASH ? ` (${APP_BUILD_HASH})` : ""}
      </Typography>
    </div>
  </div>
);
