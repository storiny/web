"use client";

import clsx from "clsx";
import NextLink from "next/link";
import React from "react";

import Avatar from "~/components/Avatar";
import Button from "~/components/Button";
import Grow from "~/components/Grow";
import Typography from "~/components/Typography";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import StoryIcon from "~/icons/Story";
import UserCheckIcon from "~/icons/UserCheck";
import UserPlusIcon from "~/icons/UserPlus";
import UsersIcon from "~/icons/Users";
import { setFollowing } from "~/redux/features";
import { useAppDispatch, useAppSelector } from "~/redux/hooks";
import { breakpoints } from "~/theme/breakpoints";
import { abbreviateNumber } from "~/utils/abbreviateNumber";

import UserActions from "./Actions";
import styles from "./User.module.scss";
import { UserProps } from "./User.props";

const User = (props: UserProps): React.ReactElement => {
  const { actionType = "default", className, user, ...rest } = props;
  const dispatch = useAppDispatch();
  const isMobile = useMediaQuery(breakpoints.down("mobile"));
  const isFollowing = useAppSelector(
    (state) => state.entities.following[user.id]
  );
  const userUrl = `/${user.username}`;

  // User-specific props are synced in `Actions`

  return (
    <div {...rest} className={clsx("flex-col", styles.user, className)}>
      <div className={clsx("flex", styles.main)}>
        <NextLink className={clsx("flex", styles.meta)} href={userUrl}>
          <Avatar
            alt={""}
            avatarId={user.avatar_id}
            hex={user.avatar_hex}
            label={user.name}
            size={"lg"}
          />
          <div className={"flex-col"}>
            <Typography ellipsis>
              <span className={isMobile ? "t-medium" : "t-bold"}>
                {user.name}
              </span>
              {!isMobile && <> @{user.username}</>}
            </Typography>
            {isMobile ? (
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
                      {abbreviateNumber(user.story_count)}{" "}
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
                    {abbreviateNumber(user.follower_count)}{" "}
                    <span className={"t-minor"}>followers</span>
                  </span>
                </Typography>
              </div>
            )}
          </div>
        </NextLink>
        <Grow />
        <div className={clsx("flex", styles.actions)}>
          {actionType === "default" && (
            <Button
              autoSize
              checkAuth
              decorator={isFollowing ? <UserCheckIcon /> : <UserPlusIcon />}
              onClick={(): void => {
                dispatch(setFollowing([user.id]));
              }}
              variant={isFollowing ? "hollow" : "rigid"}
            >
              {isFollowing ? "Following" : "Follow"}
            </Button>
          )}
          <UserActions actionType={actionType} user={user} />
        </div>
      </div>
      {Boolean(user.bio) && (
        <Typography
          as={NextLink}
          className={clsx("t-minor", styles.bio)}
          href={userUrl}
          level={"body2"}
        >
          {user.bio}
        </Typography>
      )}
    </div>
  );
};

export default React.memo(User);
