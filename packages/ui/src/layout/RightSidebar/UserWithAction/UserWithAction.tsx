"use client";

import clsx from "clsx";
import NextLink from "next/link";
import React from "react";

import IconButton from "~/components/IconButton";
import Persona from "~/entities/Persona";
import UserCheckIcon from "~/icons/UserCheck";
import UserPlusIcon from "~/icons/UserPlus";
import {
  boolean_action,
  setFollowing,
  sync_with_user
} from "~/redux/features/entities/slice";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";

import styles from "./UserWithAction.module.scss";
import { UserWithActionProps } from "./UserWithAction.props";

const UserWithAction = (props: UserWithActionProps): React.ReactElement => {
  const { user } = props;
  const dispatch = use_app_dispatch();
  const isBlocked = use_app_selector((state) => state.entities.blocks[user.id]);
  const isFollowing = use_app_selector(
    (state) => state.entities.following[user.id]
  );

  React.useEffect(() => {
    dispatch(sync_with_user(user));
  }, [dispatch, user]);

  return (
    <div className={clsx("flex-center", styles["user-with-action"])}>
      <NextLink
        className={clsx("focusable", styles.link)}
        href={`/${user.username}`}
      >
        <Persona
          avatar={{
            avatarId: user.avatar_id,
            hex: user.avatar_hex,
            label: user.name,
            alt: `${user.name}'s avatar`
          }}
          primaryText={user.name}
          secondaryText={`@${user.username}`}
        />
      </NextLink>
      <IconButton
        aria-label={isFollowing ? "Unfollow" : "Follow"}
        checkAuth
        disabled={isBlocked}
        onClick={(): void => {
          dispatch(boolean_action("following", user.id));
        }}
        title={`${isFollowing ? "Unfollow" : "Follow"} ${user.name}`}
        variant={isFollowing ? "rigid" : "hollow"}
      >
        {isFollowing ? <UserCheckIcon /> : <UserPlusIcon />}
      </IconButton>
    </div>
  );
};

export default UserWithAction;
