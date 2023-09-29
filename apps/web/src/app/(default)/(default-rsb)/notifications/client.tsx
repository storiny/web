"use client";

import { clsx } from "clsx";
import dynamic from "next/dynamic";
import NextLink from "next/link";
import React from "react";

import { dynamicLoader } from "~/common/dynamic";
import {
  NotificationListSkeleton,
  VirtualizedNotificationList
} from "~/common/notification";
import Button from "../../../../../../../packages/ui/src/components/button";
import Divider from "../../../../../../../packages/ui/src/components/divider";
import Grow from "../../../../../../../packages/ui/src/components/grow";
import IconButton from "../../../../../../../packages/ui/src/components/icon-button";
import Skeleton from "../../../../../../../packages/ui/src/components/skeleton";
import Tab from "../../../../../../../packages/ui/src/components/tab";
import Tabs from "../../../../../../../packages/ui/src/components/tabs";
import TabsList from "../../../../../../../packages/ui/src/components/tabs-list";
import Typography from "../../../../../../../packages/ui/src/components/typography";
import ErrorState from "../../../../../../../packages/ui/src/entities/error-state";
import { use_media_query } from "../../../../../../../packages/ui/src/hooks/use-media-query";
import ChecksIcon from "~/icons/Checks";
import SettingsIcon from "~/icons/Settings";
import {
  get_query_error_type,
  mark_all_as_read,
  select_notifications_status,
  select_unread_notification_count,
  use_get_notifications_query
} from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import { BREAKPOINTS } from "~/theme/breakpoints";
import { abbreviate_number } from "../../../../../../../packages/ui/src/utils/abbreviate-number";

import styles from "./styles.module.scss";

const EmptyState = dynamic(() => import("./empty-state"), {
  loading: dynamicLoader()
});

export type NotificationsTabValue = "unread" | "following" | "friends" | "all";

// Page header tabs

const PageHeader = ({
  value,
  onChange
}: {
  onChange: (newValue: NotificationsTabValue) => void;
  value: NotificationsTabValue;
}): React.ReactElement => (
  <Tabs
    className={clsx("full-bleed", "page-header", styles.x, styles.tabs)}
    onValueChange={(newValue): void =>
      onChange(newValue as NotificationsTabValue)
    }
    value={value}
  >
    <TabsList className={clsx("full-w", styles.x, styles["tabs-list"])}>
      <Tab aria-controls={undefined} value={"unread"}>
        Unread
      </Tab>
      <Tab aria-controls={undefined} value={"following"}>
        Following
      </Tab>
      <Tab aria-controls={undefined} value={"friends"}>
        Friends
      </Tab>
      <Tab aria-controls={undefined} value={"all"}>
        All
      </Tab>
    </TabsList>
  </Tabs>
);

// Status header

const StatusHeader = ({
  tab
}: {
  tab: NotificationsTabValue;
}): React.ReactElement => {
  const dispatch = use_app_dispatch();
  const is_mobile = use_media_query(BREAKPOINTS.down("mobile"));
  const unreadCount = use_app_selector(select_unread_notification_count);
  const status = use_app_selector(select_notifications_status);

  return (
    <div
      className={clsx(
        "full-bleed",
        "flex-center",
        styles.x,
        styles["status-header"]
      )}
    >
      <Typography level={"body2"}>
        {status === "loading" ? (
          <Skeleton height={14} width={64} />
        ) : unreadCount === 0 && tab !== "all" ? (
          "You do not have any unread notifications"
        ) : (
          <>
            You have{" "}
            <span className={"t-bold"}>{abbreviate_number(unreadCount)}</span>{" "}
            unread {unreadCount === 1 ? "notification" : "notifications"}
          </>
        )}
      </Typography>
      <Grow />
      <div className={clsx("flex-center", styles.x, styles["header-actions"])}>
        {is_mobile ? (
          <IconButton
            aria-label={"Mark all as read"}
            check_auth
            disabled={unreadCount === 0}
            onClick={(): void => {
              dispatch(mark_all_as_read());
            }}
            size={"lg"}
            title={"Mark all as read"}
            variant={"ghost"}
          >
            <ChecksIcon />
          </IconButton>
        ) : (
          <Button
            auto_size
            check_auth
            decorator={<ChecksIcon />}
            disabled={unreadCount === 0}
            onClick={(): void => {
              dispatch(mark_all_as_read());
            }}
            variant={"hollow"}
          >
            Mark all as read
          </Button>
        )}
        <IconButton
          aria-label={"Notification settings"}
          as={NextLink}
          auto_size
          check_auth
          href={"/me/account/notifications"}
          title={"Notification settings"}
          variant={"ghost"}
        >
          <SettingsIcon />
        </IconButton>
      </div>
    </div>
  );
};

const Client = (): React.ReactElement => {
  const [value, setValue] = React.useState<NotificationsTabValue>("unread");
  const [page, set_page] = React.useState<number>(1);
  const { data, isLoading, isFetching, isError, error, refetch } =
    use_get_notifications_query({
      page,
      type: value
    });
  const { items = [], has_more } = data || {};

  const load_more = React.useCallback(
    () => set_page((prev_state) => prev_state + 1),
    []
  );

  const handleChange = React.useCallback((newValue: NotificationsTabValue) => {
    set_page(1);
    setValue(newValue);
  }, []);

  return (
    <>
      <PageHeader onChange={handleChange} value={value} />
      {value !== "all" && <StatusHeader tab={value} />}
      {isError ? (
        <ErrorState
          auto_size
          component_props={{
            button: { loading: isFetching }
          }}
          retry={refetch}
          type={get_query_error_type(error)}
        />
      ) : !isFetching && !items.length ? (
        <EmptyState tab={value} />
      ) : isLoading || (isFetching && page === 1) ? (
        <NotificationListSkeleton />
      ) : (
        <VirtualizedNotificationList
          has_more={Boolean(has_more)}
          load_more={load_more}
          notifications={items}
        />
      )}
    </>
  );
};

export default Client;
