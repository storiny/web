"use client";
import { clsx } from "clsx";
import dynamic from "next/dynamic";
import NextLink from "next/link";
import React from "react";

import {
  NotificationListSkeleton,
  VirtualizedNotificationList
} from "~/common/notification";
import SuspenseLoader from "~/common/suspense-loader";
import Button from "~/components/Button";
import Divider from "~/components/Divider";
import Grow from "~/components/Grow";
import IconButton from "~/components/IconButton";
import Skeleton from "~/components/Skeleton";
import Tab from "~/components/Tab";
import Tabs from "~/components/Tabs";
import TabsList from "~/components/TabsList";
import Typography from "~/components/Typography";
import ErrorState from "~/entities/ErrorState";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import ChecksIcon from "~/icons/Checks";
import SettingsIcon from "~/icons/Settings";
import {
  getQueryErrorType,
  markAllAsRead,
  selectUnreadNotificationCount,
  selectUnreadNotificationsStatus,
  useGetNotificationsQuery
} from "~/redux/features";
import { useAppDispatch, useAppSelector } from "~/redux/hooks";
import { breakpoints } from "~/theme/breakpoints";
import { abbreviateNumber } from "~/utils/abbreviateNumber";

import styles from "./styles.module.scss";

const EmptyState = dynamic(() => import("./empty-state"), {
  loading: () => <SuspenseLoader />
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
  const dispatch = useAppDispatch();
  const isMobile = useMediaQuery(breakpoints.down("mobile"));
  const unreadCount = useAppSelector(selectUnreadNotificationCount);
  const status = useAppSelector(selectUnreadNotificationsStatus);

  return (
    <>
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
              <span className={"t-bold"}>{abbreviateNumber(unreadCount)}</span>{" "}
              unread {unreadCount === 1 ? "notification" : "notifications"}
            </>
          )}
        </Typography>
        <Grow />
        <div
          className={clsx("flex-center", styles.x, styles["header-actions"])}
        >
          {isMobile ? (
            <IconButton
              aria-label={"Mark all as read"}
              checkAuth
              disabled={unreadCount === 0}
              onClick={(): void => {
                dispatch(markAllAsRead());
              }}
              size={"lg"}
              title={"Mark all as read"}
              variant={"ghost"}
            >
              <ChecksIcon />
            </IconButton>
          ) : (
            <Button
              autoSize
              checkAuth
              decorator={<ChecksIcon />}
              disabled={unreadCount === 0}
              onClick={(): void => {
                dispatch(markAllAsRead());
              }}
              variant={"hollow"}
            >
              Mark all as read
            </Button>
          )}
          <IconButton
            aria-label={"Notification settings"}
            as={NextLink}
            autoSize
            checkAuth
            href={"/me/account/notifications"}
            title={"Notification settings"}
            variant={"ghost"}
          >
            <SettingsIcon />
          </IconButton>
        </div>
      </div>
      <Divider
        style={{ marginInline: "var(--grid-compensation)", marginTop: "-12px" }}
      />
    </>
  );
};

const Client = (): React.ReactElement => {
  const [value, setValue] = React.useState<NotificationsTabValue>("unread");
  const [page, setPage] = React.useState<number>(1);
  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetNotificationsQuery({
      page,
      type: value
    });
  const { items = [], hasMore } = data || {};

  const loadMore = React.useCallback(
    () => setPage((prevState) => prevState + 1),
    []
  );

  const handleChange = React.useCallback(
    (newValue: NotificationsTabValue) => setValue(newValue),
    []
  );

  return (
    <>
      <PageHeader onChange={handleChange} value={value} />
      {value !== "all" && <StatusHeader tab={value} />}
      {isError ? (
        <ErrorState
          autoSize
          componentProps={{
            button: { loading: isFetching }
          }}
          retry={refetch}
          type={getQueryErrorType(error)}
        />
      ) : !isFetching && !items.length ? (
        <EmptyState tab={value} />
      ) : isLoading ? (
        <NotificationListSkeleton />
      ) : (
        <VirtualizedNotificationList
          hasMore={Boolean(hasMore)}
          loadMore={loadMore}
          notifications={items}
        />
      )}
    </>
  );
};

export default Client;
