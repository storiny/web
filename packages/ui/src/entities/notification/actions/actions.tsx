import { Notification } from "@storiny/types";
import clsx from "clsx";
import React from "react";

import IconButton from "src/components/icon-button";
import { use_media_query } from "src/hooks/use-media-query";
import BellOffIcon from "src/icons/bell-off";
import CheckIcon from "src/icons/check";
import {
  set_read_notification,
  sync_with_notification,
  use_unsubscribe_notification_mutation
} from "~/redux/features";
import { use_app_dispatch } from "~/redux/hooks";
import { BREAKPOINTS } from "~/theme/breakpoints";

import styles from "../notification.module.scss";

const Actions = ({
  notification
}: {
  notification: Notification;
}): React.ReactElement | null => {
  const dispatch = use_app_dispatch();
  const is_mobile = use_media_query(BREAKPOINTS.down("mobile"));
  const [
    unsubscribe,
    { isLoading: is_loading, isError: is_error, isSuccess: is_success }
  ] = use_unsubscribe_notification_mutation();

  React.useEffect(() => {
    dispatch(sync_with_notification(notification));
  }, [dispatch, notification]);

  const unsubscribe_impl = (): void => {
    unsubscribe({ id: notification.id, type: notification.type });
  };

  if (is_mobile) {
    return null;
  }

  return (
    <div className={clsx("flex", styles.actions)}>
      <IconButton
        aria-label={"Mark notification as read"}
        check_auth
        onClick={(): void => {
          dispatch(set_read_notification([notification.id, true]));
        }}
        title={"Mark as read"}
        variant={"ghost"}
      >
        <CheckIcon />
      </IconButton>
      {!is_success && (
        <IconButton
          aria-label={
            "Unsubscribe from this type of notification in the future"
          }
          check_auth
          color={!is_loading && is_error ? "ruby" : "inverted"}
          loading={is_loading}
          onClick={unsubscribe_impl}
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
