"use client";

import clsx from "clsx";
import NextLink from "next/link";
import React from "react";

import IconButton from "src/components/icon-button";
import Persona from "src/entities/persona";
import UserCheckIcon from "src/icons/user-check";
import UserPlusIcon from "src/icons/user-plus";
import { sync_with_user } from "~/redux/features/entities/slice";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";

import styles from "./user-with-action.module.scss";
import { UserWithActionProps } from "./user-with-action.props";
import { boolean_action } from "~/redux/features";

const UserWithAction = (props: UserWithActionProps): React.ReactElement => {
  const { user } = props;
  const dispatch = use_app_dispatch();
  const is_blocked = use_app_selector(
    (state) => state.entities.blocks[user.id]
  );
  const is_following = use_app_selector(
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
            avatar_id: user.avatar_id,
            hex: user.avatar_hex,
            label: user.name,
            alt: `${user.name}'s avatar`
          }}
          primary_text={user.name}
          secondary_text={`@${user.username}`}
        />
      </NextLink>
      <IconButton
        aria-label={is_following ? "Unfollow" : "Follow"}
        check_auth
        disabled={is_blocked}
        onClick={(): void => {
          dispatch(boolean_action("following", user.id));
        }}
        title={`${is_following ? "Unfollow" : "Follow"} ${user.name}`}
        variant={is_following ? "rigid" : "hollow"}
      >
        {is_following ? <UserCheckIcon /> : <UserPlusIcon />}
      </IconButton>
    </div>
  );
};

export default UserWithAction;
