"use client";

import clsx from "clsx";
import NextLink from "next/link";
import React from "react";

import Avatar from "src/components/avatar";
import Button from "src/components/button";
import Grow from "src/components/grow";
import Typography from "src/components/typography";
import { use_media_query } from "src/hooks/use-media-query";
import CalendarIcon from "~/icons/Calendar";
import StoryIcon from "~/icons/Story";
import TagIcon from "~/icons/Tag";
import UsersIcon from "~/icons/Users";
import { boolean_action, sync_with_tag } from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import { BREAKPOINTS } from "~/theme/breakpoints";
import { abbreviate_number } from "src/utils/abbreviate-number";
import { DateFormat, format_date } from "src/utils/format-date";

import styles from "./tag.module.scss";
import { TagProps } from "./tag.props";

const Tag = (props: TagProps): React.ReactElement => {
  const { className, tag, virtual, ...rest } = props;
  const dispatch = use_app_dispatch();
  const is_mobile = use_media_query(BREAKPOINTS.down("mobile"));
  const is_following = use_app_selector(
    (state) => state.entities.followed_tags[tag.id]
  );
  const follower_count =
    use_app_selector((state) => state.entities.tag_follower_counts[tag.id]) ||
    0;
  const tag_url = `/tag/${tag.name}`;

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
        <NextLink className={clsx("flex-center", styles.meta)} href={tag_url}>
          <Avatar className={styles.avatar} size={"lg"}>
            <TagIcon />
          </Avatar>
          <Typography className={styles["tag-name"]} ellipsis>
            {tag.name}
          </Typography>
        </NextLink>
        <Grow />
        <Button
          auto_size
          check_auth
          onClick={(): void => {
            dispatch(boolean_action("followed_tags", tag.id));
          }}
          variant={is_following ? "hollow" : "rigid"}
        >
          {is_following ? "Following" : "Follow"}
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
            {abbreviate_number(tag.story_count)}
            {!is_mobile && (
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
          title={`${follower_count.toLocaleString()} followers`}
        >
          <span className={clsx("flex-center", styles["stat-icon"])}>
            <UsersIcon />
          </span>
          <span>
            {abbreviate_number(follower_count)}
            {!is_mobile && (
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
          title={format_date(tag.created_at)}
        >
          {is_mobile ? (
            <>
              <span className={clsx("flex-center", styles["stat-icon"])}>
                <CalendarIcon />
              </span>
              <span>{format_date(tag.created_at, DateFormat.RELATIVE)}</span>
            </>
          ) : (
            `Created ${format_date(tag.created_at, DateFormat.RELATIVE)}`
          )}
        </Typography>
      </div>
    </div>
  );
};

export default React.memo(Tag);
