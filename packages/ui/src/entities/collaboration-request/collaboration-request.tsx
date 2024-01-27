"use client";

import clsx from "clsx";
import NextLink from "next/link";
import React from "react";

import Avatar from "~/components/avatar";
import Button from "~/components/button";
import DateTime from "~/components/date-time";
import { use_toast } from "~/components/toast";
import Typography from "~/components/typography";
import UserIcon from "~/icons/user";
import {
  get_collaboration_requests_api,
  get_contributions_api,
  use_accept_collaboration_request_mutation,
  use_cancel_collaboration_request_mutation,
  use_reject_collaboration_request_mutation
} from "~/redux/features";
import { use_app_dispatch } from "~/redux/hooks";
import css from "~/theme/main.module.scss";
import { DateFormat } from "~/utils/format-date";
import { handle_api_error } from "~/utils/handle-api-error";

import styles from "./collaboration-request.module.scss";
import { CollaborationRequestProps } from "./collaboration-request.props";

const CollaborationRequest = (
  props: CollaborationRequestProps
): React.ReactElement => {
  const {
    className,
    type = "received",
    collaboration_request,
    ...rest
  } = props;
  const { user, story } = collaboration_request;
  const toast = use_toast();
  const dispatch = use_app_dispatch();
  const user_url = `/${user?.username || ""}`;
  const [accept_request, { isLoading: is_accept_loading }] =
    use_accept_collaboration_request_mutation();
  const [reject_request, { isLoading: is_reject_loading }] =
    use_reject_collaboration_request_mutation();
  const [cancel_request, { isLoading: is_cancel_loading }] =
    use_cancel_collaboration_request_mutation();

  /**
   * Accepts the collaboration request
   */
  const handle_accept = (): void => {
    accept_request({ id: collaboration_request.id })
      .unwrap()
      .then(() => {
        toast("Request accepted", "success");
        dispatch(get_contributions_api.util.resetApiState());
        dispatch(get_collaboration_requests_api.util.resetApiState());
      })
      .catch((error) =>
        handle_api_error(error, toast, null, "Could not accept the request")
      );
  };

  /**
   * Rejects the collaboration request
   */
  const handle_reject = (): void => {
    reject_request({ id: collaboration_request.id })
      .unwrap()
      .then(() => {
        toast("Request rejected", "success");
        dispatch(get_collaboration_requests_api.util.resetApiState());
      })
      .catch((error) =>
        handle_api_error(error, toast, null, "Could not reject the request")
      );
  };

  /**
   * Cancels the collaboration request
   */
  const handle_cancel = (): void => {
    cancel_request({ id: collaboration_request.id })
      .unwrap()
      .then(() => {
        toast("Request cancelled", "success");
        dispatch(get_collaboration_requests_api.util.resetApiState());
      })
      .catch((error) =>
        handle_api_error(error, toast, null, "Could not cancel the request")
      );
  };

  return (
    <div
      {...rest}
      className={clsx(
        css["flex-center"],
        styles["collaboration-request"],
        className
      )}
    >
      <NextLink
        className={clsx(css["flex-center"], styles.meta)}
        href={user_url}
      >
        {user === null ? (
          <Avatar className={styles.avatar}>
            <UserIcon />
          </Avatar>
        ) : (
          <Avatar
            alt={""}
            avatar_id={user.avatar_id}
            hex={user.avatar_hex}
            label={user.name}
            size={"md"}
          />
        )}
        <div className={css["flex-col"]}>
          <Typography className={css["t-medium"]} ellipsis level={"body2"}>
            {story.title}
          </Typography>
          <Typography className={css["t-minor"]} ellipsis level={"body3"}>
            {user === null ? "Deleted user" : `@${user.username}`} &bull;{" "}
            <DateTime
              date={collaboration_request.created_at}
              format={DateFormat.RELATIVE_CAPITALIZED}
            />
          </Typography>
        </div>
      </NextLink>
      <div className={clsx(css["flex-center"], styles.actions)}>
        {type === "received" ? (
          <React.Fragment>
            <Button
              auto_size
              check_auth
              disabled={is_reject_loading}
              loading={is_accept_loading}
              onClick={handle_accept}
            >
              Accept
            </Button>
            <Button
              auto_size
              check_auth
              disabled={is_accept_loading}
              loading={is_reject_loading}
              onClick={handle_reject}
              variant={"hollow"}
            >
              Reject
            </Button>
          </React.Fragment>
        ) : (
          <Button
            auto_size
            check_auth
            loading={is_cancel_loading}
            onClick={handle_cancel}
            variant={"hollow"}
          >
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
};

export default React.memo(CollaborationRequest);
