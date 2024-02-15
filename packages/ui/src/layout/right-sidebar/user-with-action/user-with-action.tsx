"use client";

import clsx from "clsx";
import NextLink from "next/link";
import React from "react";

import Grow from "~/components/grow";
import IconButton from "~/components/icon-button";
import Typography from "~/components/typography";
import UserHoverCard from "~/components/user-hover-card";
import Persona from "~/entities/persona";
import UserCheckIcon from "~/icons/user-check";
import UserPlusIcon from "~/icons/user-plus";
import { boolean_action, select_user } from "~/redux/features";
import { sync_with_user } from "~/redux/features/entities/slice";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import css from "~/theme/main.module.scss";

import styles from "./user-with-action.module.scss";
import { UserWithActionProps } from "./user-with-action.props";

const UserWithAction = (props: UserWithActionProps): React.ReactElement => {
  const { user } = props;
  const dispatch = use_app_dispatch();
  const current_user = use_app_selector(select_user);
  const is_blocked = use_app_selector(
    (state) => state.entities.blocks[user.id]
  );
  const is_following = use_app_selector(
    (state) => state.entities.following[user.id]
  );
  const is_self = user.id === current_user?.id;

  React.useEffect(() => {
    dispatch(sync_with_user(user));
  }, [dispatch, user]);

  return (
    <div className={clsx(css["flex-center"], styles["user-with-action"])}>
      <UserHoverCard identifier={user.id}>
        <NextLink
          className={clsx(css["focusable"], styles.link)}
          href={`/${user.username}`}
        >
          <Persona
            avatar={{
              avatar_id: user.avatar_id,
              hex: user.avatar_hex,
              label: user.name,
              alt: `${user.name}'s avatar`
            }}
            component_props={{
              secondary_text: { className: css.ellipsis },
              primary_text: { className: styles.text }
            }}
            primary_text={
              <Typography
                as={"span"}
                className={css.ellipsis}
                level={"body2"}
                style={{ color: "inherit", fontWeight: "inherit" }}
              >
                {user.name}
              </Typography>
            }
            secondary_text={`@${user.username}`}
          />
        </NextLink>
      </UserHoverCard>
      {is_self ? (
        <Grow />
      ) : (
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
      )}
    </div>
  );
};

export default UserWithAction;
