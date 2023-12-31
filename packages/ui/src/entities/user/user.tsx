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
import { boolean_action, select_user, sync_with_user } from "~/redux/features";
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
  const current_user = use_app_selector(select_user);
  const is_mobile = use_media_query(BREAKPOINTS.down("mobile"));
  const is_following = use_app_selector(
    (state) => state.entities.following[user.id]
  );
  const follower_count =
    use_app_selector((state) => state.entities.follower_counts[user.id]) || 0;
  const user_url = `/${user.username}`;
  const is_self = current_user?.id === user.id;

  React.useEffect(() => {
    dispatch(sync_with_user(user));
  }, [dispatch, user]);

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
          <div className={clsx(css["flex-col"], styles.details)}>
            <Typography ellipsis>
              <span className={css[is_mobile ? "t-medium" : "t-bold"]}>
                {user.name}
              </span>
              {!is_mobile && (
                <span className={css["t-minor"]}> @{user.username}</span>
              )}
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
                    title={`${user.story_count.toLocaleString()} ${
                      user.story_count === 1 ? "story" : "stories"
                    }`}
                  >
                    <span
                      className={clsx(css["flex-center"], styles["stat-icon"])}
                    >
                      <StoryIcon />
                    </span>
                    <span>
                      {abbreviate_number(user.story_count)}{" "}
                      <span className={css["t-minor"]}>
                        {user.story_count === 1 ? "story" : "stories"}
                      </span>
                    </span>
                  </Typography>
                )}
                <Typography
                  className={clsx(css["flex-center"], styles.stat)}
                  level={"body2"}
                  title={`${follower_count.toLocaleString()} ${
                    follower_count === 1 ? "follower" : "followers"
                  }`}
                >
                  <span
                    className={clsx(css["flex-center"], styles["stat-icon"])}
                  >
                    <UsersIcon />
                  </span>
                  <span>
                    {abbreviate_number(follower_count)}{" "}
                    <span className={css["t-minor"]}>
                      {follower_count === 1 ? "follower" : "followers"}
                    </span>
                  </span>
                </Typography>
              </div>
            )}
          </div>
        </NextLink>
        <Grow />
        <div className={clsx(css["flex"], styles.actions)}>
          {!is_self && action_type === "default" ? (
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
          ) : null}
          {!hide_action && (
            <UserActions action_type={action_type} user={user} />
          )}
        </div>
      </div>
      {Boolean(user.rendered_bio.trim()) && (
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
