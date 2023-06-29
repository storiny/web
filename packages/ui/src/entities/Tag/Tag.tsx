import clsx from "clsx";
import NextLink from "next/link";
import React from "react";

import Chip from "~/components/Chip";
import Grow from "~/components/Grow";
import Typography from "~/components/Typography";
import HashIcon from "~/icons/Hash";
import StoriesIcon from "~/icons/Stories";
import UsersIcon from "~/icons/Users";
import { abbreviateNumber } from "~/utils/abbreviateNumber";

import styles from "./Tag.module.scss";
import { TagProps } from "./Tag.props";

const Tag = (props: TagProps) => {
  const {
    value,
    storyCount,
    followerCount,
    className,
    withDecorator,
    disabled,
    ...rest
  } = props;
  const hasStoryCount = typeof storyCount !== "undefined";
  const hasFollowerCount = typeof followerCount !== "undefined";

  return (
    <Chip
      {...rest}
      as={NextLink}
      className={clsx("flex-center", "t-regular", styles.tag, className)}
      decorator={withDecorator ? <HashIcon /> : null}
      disabled={disabled}
      href={`/tag/${value}`}
      title={`Explore #${value}`}
      type={"clickable"}
      variant={"soft"}
    >
      <span className={"ellipsis"}>{value}</span>
      {hasStoryCount || hasFollowerCount ? <Grow /> : null}
      {hasStoryCount && (
        <Typography
          aria-label={`${storyCount} ${storyCount === 1 ? "story" : "stories"}`}
          as={"span"}
          className={clsx(
            "flex-center",
            "t-medium",
            !disabled && "t-minor",
            styles.stat
          )}
          data-first-child={"true"}
          level={"body3"}
        >
          <StoriesIcon />
          {abbreviateNumber(storyCount)}
        </Typography>
      )}
      {hasFollowerCount && (
        <Typography
          aria-label={`${followerCount} ${
            followerCount === 1 ? "follower" : "followers"
          }`}
          as={"span"}
          className={clsx(
            "flex-center",
            "t-medium",
            !disabled && "t-minor",
            styles.stat
          )}
          data-first-child={String(typeof storyCount === "undefined")}
          level={"body3"}
        >
          <UsersIcon />
          {abbreviateNumber(followerCount)}
        </Typography>
      )}
    </Chip>
  );
};

export default Tag;
