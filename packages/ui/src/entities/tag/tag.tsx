"use client";

import clsx from "clsx";
import NextLink from "next/link";
import React from "react";

import Avatar from "~/components/Avatar";
import Button from "~/components/Button";
import Grow from "~/components/Grow";
import Typography from "~/components/Typography";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import CalendarIcon from "~/icons/Calendar";
import StoryIcon from "~/icons/Story";
import TagIcon from "~/icons/Tag";
import UsersIcon from "~/icons/Users";
import {
  boolean_action,
  setFollowedTag,
  sync_with_tag
} from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import { breakpoints } from "~/theme/breakpoints";
import { abbreviateNumber } from "~/utils/abbreviateNumber";
import { DateFormat, formatDate } from "~/utils/formatDate";

import styles from "./tag.module.scss";
import { TagProps } from "./tag.props";

const Tag = (props: TagProps): React.ReactElement => {
  const { className, tag, virtual, ...rest } = props;
  const dispatch = use_app_dispatch();
  const isMobile = useMediaQuery(breakpoints.down("mobile"));
  const isFollowing = use_app_selector(
    (state) => state.entities.followedTags[tag.id]
  );
  const followerCount =
    use_app_selector((state) => state.entities.tagFollowerCounts[tag.id]) || 0;
  const tagUrl = `/tag/${tag.name}`;

  React.useEffect(() => {
    dispatch(sync_with_tag(tag));
  }, [dispatch, tag]);

  return (
    <div
      {...rest}
      className={clsx(
        "flex-col",
        styles.tag,
        virtual && styles.virtual,
        className
      )}
    >
      <div className={clsx("flex-center", styles.main)}>
        <NextLink className={clsx("flex-center", styles.meta)} href={tagUrl}>
          <Avatar className={styles.avatar} size={"lg"}>
            <TagIcon />
          </Avatar>
          <Typography className={styles["tag-name"]} ellipsis>
            {tag.name}
          </Typography>
        </NextLink>
        <Grow />
        <Button
          autoSize
          checkAuth
          onClick={(): void => {
            dispatch(boolean_action("followed_tags", tag.id));
          }}
          variant={isFollowing ? "hollow" : "rigid"}
        >
          {isFollowing ? "Following" : "Follow"}
        </Button>
      </div>
      <div className={clsx("flex-center", styles.stats)}>
        <Typography
          className={clsx("flex-center", styles.stat)}
          level={"body2"}
          title={`${tag.story_count.toLocaleString()} stories`}
        >
          <span className={clsx("flex-center", styles["stat-icon"])}>
            <StoryIcon />
          </span>
          <span>
            {abbreviateNumber(tag.story_count)}
            {!isMobile && (
              <>
                {" "}
                <span className={"t-minor"}>stories</span>
              </>
            )}
          </span>
        </Typography>
        <Typography
          className={clsx("flex-center", styles.stat)}
          level={"body2"}
          title={`${followerCount.toLocaleString()} followers`}
        >
          <span className={clsx("flex-center", styles["stat-icon"])}>
            <UsersIcon />
          </span>
          <span>
            {abbreviateNumber(followerCount)}
            {!isMobile && (
              <>
                {" "}
                <span className={"t-minor"}>followers</span>
              </>
            )}
          </span>
        </Typography>
        <Grow />
        <Typography
          as={"time"}
          className={clsx("flex-center", "t-minor", styles.stat)}
          dateTime={tag.created_at}
          level={"body2"}
          title={formatDate(tag.created_at)}
        >
          {isMobile ? (
            <>
              <span className={clsx("flex-center", styles["stat-icon"])}>
                <CalendarIcon />
              </span>
              <span>{formatDate(tag.created_at, DateFormat.RELATIVE)}</span>
            </>
          ) : (
            `Created ${formatDate(tag.created_at, DateFormat.RELATIVE)}`
          )}
        </Typography>
      </div>
    </div>
  );
};

export default React.memo(Tag);
