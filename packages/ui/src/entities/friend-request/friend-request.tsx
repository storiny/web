"use client";

import clsx from "clsx";
import NextLink from "next/link";
import React from "react";

import Avatar from "~/components/Avatar";
import Button from "~/components/Button";
import { useToast } from "~/components/Toast";
import Typography from "~/components/Typography";
import {
  get_friend_requests_api,
  use_accept_friend_request_mutation,
  use_reject_friend_request_mutation
} from "~/redux/features";
import { use_app_dispatch } from "~/redux/hooks";
import { DateFormat, formatDate } from "~/utils/formatDate";

import styles from "./friend-request.module.scss";
import { FriendRequestProps } from "./friend-request.props";

const FriendRequest = (props: FriendRequestProps): React.ReactElement => {
  const { className, friendRequest, ...rest } = props;
  const { user } = friendRequest;
  const toast = useToast();
  const dispatch = use_app_dispatch();
  const userUrl = `/${user.username}`;
  const [acceptRequest, { isLoading: isAcceptLoading }] =
    use_accept_friend_request_mutation();
  const [rejectRequest, { isLoading: isRejectLoading }] =
    use_reject_friend_request_mutation();

  /**
   * Accepts the friend request
   */
  const handleAccept = (): void => {
    acceptRequest({ id: friendRequest.id })
      .unwrap()
      .then(() => {
        toast("Request accepted", "success");
        dispatch(get_friend_requests_api.util.resetApiState());
      })
      .catch((e) =>
        toast(e?.data?.error || `Could not accept the request`, "error")
      );
  };

  /**
   * Rejects the friend request
   */
  const handleReject = (): void => {
    rejectRequest({ id: friendRequest.id })
      .unwrap()
      .then(() => {
        toast("Request rejected", "success");
        dispatch(get_friend_requests_api.util.resetApiState());
      })
      .catch((e) =>
        toast(e?.data?.error || `Could not reject the request`, "error")
      );
  };

  return (
    <div
      {...rest}
      className={clsx("flex-center", styles["friend-request"], className)}
    >
      <NextLink className={clsx("flex-center", styles.meta)} href={userUrl}>
        <Avatar
          alt={""}
          avatarId={user.avatar_id}
          hex={user.avatar_hex}
          label={user.name}
          size={"md"}
        />
        <div className={"flex-col"}>
          <Typography className={"t-medium"} ellipsis level={"body2"}>
            {user.name}
          </Typography>
          <Typography className={"t-minor"} ellipsis level={"body3"}>
            @{user.username} &bull;{" "}
            {formatDate(
              friendRequest.created_at,
              DateFormat.RELATIVE_CAPITALIZED
            )}
          </Typography>
        </div>
      </NextLink>
      <div className={clsx("flex-center", styles.actions)}>
        <Button
          autoSize
          checkAuth
          disabled={isRejectLoading}
          loading={isAcceptLoading}
          onClick={handleAccept}
        >
          Accept
        </Button>
        <Button
          autoSize
          checkAuth
          disabled={isAcceptLoading}
          loading={isRejectLoading}
          onClick={handleReject}
          variant={"hollow"}
        >
          Reject
        </Button>
      </div>
    </div>
  );
};

export default React.memo(FriendRequest);
