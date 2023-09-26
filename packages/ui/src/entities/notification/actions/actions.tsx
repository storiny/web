import { Notification } from "@storiny/types";
import clsx from "clsx";
import React from "react";

import IconButton from "~/components/IconButton";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import BellOffIcon from "~/icons/BellOff";
import CheckIcon from "~/icons/Check";
import {
  set_read_notification,
  syncWithNotification,
  useUnsubscribeNotificationMutation
} from "~/redux/features";
import { useAppDispatch } from "~/redux/hooks";
import { breakpoints } from "~/theme/breakpoints";

import styles from "../notification.module.scss";

const Actions = ({
  notification
}: {
  notification: Notification;
}): React.ReactElement | null => {
  const dispatch = useAppDispatch();
  const isMobile = useMediaQuery(breakpoints.down("mobile"));
  const [unsubscribe, { isLoading, isError, isSuccess }] =
    useUnsubscribeNotificationMutation();

  React.useEffect(() => {
    dispatch(syncWithNotification(notification));
  }, [dispatch, notification]);

  const unsubscribeImpl = (): void => {
    unsubscribe({ id: notification.id, type: notification.type });
  };

  if (isMobile) {
    return null;
  }

  return (
    <div className={clsx("flex", styles.actions)}>
      <IconButton
        aria-label={"Mark notification as read"}
        checkAuth
        onClick={(): void => {
          dispatch(set_read_notification([notification.id, true]));
        }}
        title={"Mark as read"}
        variant={"ghost"}
      >
        <CheckIcon />
      </IconButton>
      {!isSuccess && (
        <IconButton
          aria-label={
            "Unsubscribe from this type of notification in the future"
          }
          checkAuth
          color={!isLoading && isError ? "ruby" : "inverted"}
          loading={isLoading}
          onClick={unsubscribeImpl}
          title={"Unsubscribe from this type of notification in the future"}
          variant={"ghost"}
        >
          <BellOffIcon />
        </IconButton>
      )}
    </div>
  );
};

export default Actions;
