"use client";

import React from "react";

import Notification, { NotificationProvider } from "~/components/Notification";
import { selectNotificationState } from "~/redux/features/notification/selectors";
import { setNotificationOpen } from "~/redux/features/notification/slice";
import { useAppDispatch, useAppSelector } from "~/redux/hooks";

const NotificationWithState = (): React.ReactElement => {
  const dispatch = useAppDispatch();
  const { open, icon, message, primaryText, secondaryText } = useAppSelector(
    selectNotificationState
  );

  return (
    <NotificationProvider>
      <Notification
        icon={icon}
        onOpenChange={(newState): void => {
          dispatch(setNotificationOpen(newState));
        }}
        open={open}
        primaryButtonText={primaryText}
        secondaryButtonText={secondaryText}
      >
        {message}
      </Notification>
    </NotificationProvider>
  );
};

export default NotificationWithState;
