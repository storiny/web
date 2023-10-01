import React from "react";

import CustomState from "~/entities/custom-state";
import NotificationIcon from "~/icons/notification";

import { NotificationsTabValue } from "./client";

interface NotificationsEmptyStateProps {
  tab: NotificationsTabValue;
}

const NotificationsEmptyState = ({
  tab
}: NotificationsEmptyStateProps): React.ReactElement => (
  <CustomState
    auto_size
    description={
      tab === "following"
        ? "Stay up-to-date with the latest ideas from writers you follow here."
        : tab === "friends"
        ? "This is where you can stay up-to-date with the latest ideas from your friends."
        : tab === "all"
        ? "This is where you will find all your notifications."
        : "Stay up-to-date with the latest ideas from your favorite writers here."
    }
    icon={<NotificationIcon />}
    title={tab === "unread" ? "No unread notifications" : "No notifications"}
  />
);

export default NotificationsEmptyState;
