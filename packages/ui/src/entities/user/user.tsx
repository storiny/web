"use client";

import clsx from "clsx";
import NextLink from "next/link";
import React from "react";

import Avatar from "~/components/avatar";
import Button from "~/components/button";
import Grow from "~/components/grow";
import Typography from "~/components/typography";
import BioParser from "~/entities/bio-parser";
import { use_media_query } from "~/hooks/use-media-query";
import StoryIcon from "~/icons/story";
import UserCheckIcon from "~/icons/user-check";
import UserPlusIcon from "~/icons/user-plus";
import UsersIcon from "~/icons/users";
import { boolean_action } from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import { BREAKPOINTS } from "~/theme/breakpoints";
import css from "~/theme/main.module.scss";
import { abbreviate_number } from "~/utils/abbreviate-number";

import UserActions from "./actions";
import styles from "./user.module.scss";
import { UserProps } from "./user.props";

const User = (props: UserProps): React.ReactElement => {
  const {
    action_type = "default",
    hide_action,
    className,
    user,
    virtual,
    ...rest
  } = props;
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
        css["flex-col"],
        styles.user,
        virtual && styles.virtual,
        className
      )}
    >
      <div className={clsx(css["flex"], styles.main)}>
        <NextLink className={clsx(css["flex"], styles.meta)} href={user_url}>
          <Avatar
            alt={""}
            avatar_id={user.avatar_id}
            hex={user.avatar_hex}
            label={user.name}
            size={"lg"}
          />
          <div className={css["flex-col"]}>
            <Typography ellipsis>
              <span className={css[is_mobile ? "t-medium" : "t-bold"]}>
                {user.name}
              </span>
              {!is_mobile && <> @{user.username}</>}
            </Typography>
            {is_mobile ? (
              <Typography className={css["t-minor"]}>
                @{user.username}
              </Typography>
            ) : (
              <div className={clsx(css["flex"], styles.stats)}>
                {user.story_count > 0 && (
                  <Typography
                    className={clsx(css["flex-center"], styles.stat)}
                    level={"body2"}
                    title={`${user.story_count.toLocaleString()} stories`}
                  >
                    <span
                      className={clsx(css["flex-center"], styles["stat-icon"])}
                    >
                      <StoryIcon />
                    </span>
                    <span>
                      {abbreviate_number(user.story_count)}{" "}
                      <span className={css["t-minor"]}>stories</span>
                    </span>
                  </Typography>
                )}
                <Typography
                  className={clsx(css["flex-center"], styles.stat)}
                  level={"body2"}
                  title={`${user.follower_count.toLocaleString()} followers`}
                >
                  <span
                    className={clsx(css["flex-center"], styles["stat-icon"])}
                  >
                    <UsersIcon />
                  </span>
                  <span>
                    {abbreviate_number(user.follower_count)}{" "}
                    <span className={css["t-minor"]}>followers</span>
                  </span>
                </Typography>
              </div>
            )}
          </div>
        </NextLink>
        <Grow />
        <div className={clsx(css["flex"], styles.actions)}>
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
          {!hide_action && (
            <UserActions action_type={action_type} user={user} />
          )}
        </div>
      </div>
      {Boolean(user.bio.trim()) && (
        <Typography
          as={NextLink}
          className={clsx(css["t-minor"], styles.bio)}
          href={user_url}
          level={"body2"}
        >
          <BioParser content={user.rendered_bio} />
        </Typography>
      )}
    </div>
  );
};

export default React.memo(User);
