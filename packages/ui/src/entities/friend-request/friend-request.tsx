"use client";

import clsx from "clsx";
import NextLink from "next/link";
import React from "react";

import Avatar from "~/components/avatar";
import Button from "~/components/button";
import DateTime from "~/components/date-time";
import { use_toast } from "~/components/toast";
import Typography from "~/components/typography";
import {
  get_friend_requests_api,
  use_accept_friend_request_mutation,
  use_reject_friend_request_mutation
} from "~/redux/features";
import { use_app_dispatch } from "~/redux/hooks";
import css from "~/theme/main.module.scss";
import { DateFormat } from "~/utils/format-date";
import { handle_api_error } from "~/utils/handle-api-error";

import styles from "./friend-request.module.scss";
import { FriendRequestProps } from "./friend-request.props";

const FriendRequest = (props: FriendRequestProps): React.ReactElement => {
  const { className, friend_request, ...rest } = props;
  const { user } = friend_request;
  const toast = use_toast();
  const dispatch = use_app_dispatch();
  const user_url = `/${user.username}`;
  const [accept_request, { isLoading: is_accept_loading }] =
    use_accept_friend_request_mutation();
  const [reject_request, { isLoading: is_reject_loading }] =
    use_reject_friend_request_mutation();

  /**
   * Accepts the friend request
   */
  const handle_accept = (): void => {
    accept_request({ id: friend_request.id })
      .unwrap()
      .then(() => {
        toast("Request accepted", "success");
        dispatch(get_friend_requests_api.util.resetApiState());
      })
      .catch((error) =>
        handle_api_error(error, toast, null, "Could not accept the request")
      );
  };

  /**
   * Rejects the friend request
   */
  const handle_reject = (): void => {
    reject_request({ id: friend_request.id })
      .unwrap()
      .then(() => {
        toast("Request rejected", "success");
        dispatch(get_friend_requests_api.util.resetApiState());
      })
      .catch((error) =>
        handle_api_error(error, toast, null, "Could not reject the request")
      );
  };

  return (
    <div
      {...rest}
      className={clsx(css["flex-center"], styles["friend-request"], className)}
    >
      <NextLink
        className={clsx(css["flex-center"], styles.meta)}
        href={user_url}
      >
        <Avatar
          alt={""}
          avatar_id={user.avatar_id}
          hex={user.avatar_hex}
          label={user.name}
          size={"md"}
        />
        <div className={css["flex-col"]}>
          <Typography ellipsis level={"body2"} weight={"medium"}>
            {user.name}
          </Typography>
          <Typography color={"minor"} ellipsis level={"body3"}>
            @{user.username} &bull;{" "}
            <DateTime
              date={friend_request.created_at}
              format={DateFormat.RELATIVE_CAPITALIZED}
            />
          </Typography>
        </div>
      </NextLink>
      <div className={clsx(css["flex-center"], styles.actions)}>
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
      </div>
    </div>
  );
};

export default React.memo(FriendRequest);
