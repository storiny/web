"use client";

import clsx from "clsx";
import NextLink from "next/link";
import React from "react";
import Avatar from "src/components/avatar";
import Button from "src/components/button";
import Grow from "src/components/grow";
import Typography from "src/components/typography";
import { use_media_query } from "src/hooks/use-media-query";
import { abbreviate_number } from "src/utils/abbreviate-number";

import StoryIcon from "src/icons/story";
import UserCheckIcon from "src/icons/user-check";
import UserPlusIcon from "src/icons/user-plus";
import UsersIcon from "src/icons/users";
import { boolean_action } from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import { BREAKPOINTS } from "~/theme/breakpoints";

import UserActions from "./actions";
import styles from "./user.module.scss";
import { UserProps } from "./user.props";

const User = (props: UserProps): React.ReactElement => {
  const { action_type = "default", className, user, virtual, ...rest } = props;
  const dispatch = use_app_dispatch();
  const is_mobile = use_media_query(BREAKPOINTS.down("mobile"));
  const is_following = use_app_selector(
    (state) => state.entities.following[user.id]
  );
  const user_url = `/${user.username}`;

  // User-specific props are synced in `Actions`

  return (
    <div
      {...rest}
      className={clsx(
        "flex-col",
        styles.user,
        virtual && styles.virtual,
        className
      )}
    >
      <div className={clsx("flex", styles.main)}>
        <NextLink className={clsx("flex", styles.meta)} href={user_url}>
          <Avatar
            alt={""}
            avatar_id={user.avatar_id}
            hex={user.avatar_hex}
            label={user.name}
            size={"lg"}
          />
          <div className={"flex-col"}>
            <Typography ellipsis>
              <span className={is_mobile ? "t-medium" : "t-bold"}>
                {user.name}
              </span>
              {!is_mobile && <> @{user.username}</>}
            </Typography>
            {is_mobile ? (
              <Typography className={"t-minor"}>@{user.username}</Typography>
            ) : (
              <div className={clsx("flex", styles.stats)}>
                {user.story_count > 0 && (
                  <Typography
                    className={clsx("flex-center", styles.stat)}
                    level={"body2"}
                    title={`${user.story_count.toLocaleString()} stories`}
                  >
                    <span className={clsx("flex-center", styles["stat-icon"])}>
                      <StoryIcon />
                    </span>
                    <span>
                      {abbreviate_number(user.story_count)}{" "}
                      <span className={"t-minor"}>stories</span>
                    </span>
                  </Typography>
                )}
                <Typography
                  className={clsx("flex-center", styles.stat)}
                  level={"body2"}
                  title={`${user.follower_count.toLocaleString()} followers`}
                >
                  <span className={clsx("flex-center", styles["stat-icon"])}>
                    <UsersIcon />
                  </span>
                  <span>
                    {abbreviate_number(user.follower_count)}{" "}
                    <span className={"t-minor"}>followers</span>
                  </span>
                </Typography>
              </div>
            )}
          </div>
        </NextLink>
        <Grow />
        <div className={clsx("flex", styles.actions)}>
          {action_type === "default" && (
            <Button
              auto_size
              check_auth
              decorator={is_following ? <UserCheckIcon /> : <UserPlusIcon />}
              onClick={(): void => {
                dispatch(boolean_action("following", user.id));
              }}
              variant={is_following ? "hollow" : "rigid"}
            >
              {is_following ? "Following" : "Follow"}
            </Button>
          )}
          <UserActions action_type={action_type} user={user} />
        </div>
      </div>
      {Boolean(user.bio) && (
        <Typography
          as={NextLink}
          className={clsx("t-minor", styles.bio)}
          href={user_url}
          level={"body2"}
        >
          {user.bio}
        </Typography>
      )}
    </div>
  );
};

export default React.memo(User);
