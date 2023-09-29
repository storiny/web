import clsx from "clsx";
import NextLink from "next/link";
import React from "react";

import Chip from "src/components/chip";
import Grow from "src/components/grow";
import Typography from "src/components/typography";
import HashIcon from "src/icons/hash";
import StoriesIcon from "src/icons/stories";
import UsersIcon from "src/icons/users";
import { abbreviate_number } from "src/utils/abbreviate-number";

import styles from "./tag-chip.module.scss";
import { TagChipProps } from "./tag-chip.props";
import { is_num } from "@storiny/shared/src/utils/is-num";

const TagChip = (props: TagChipProps): React.ReactElement => {
  const {
    value,
    story_count,
    follower_count,
    className,
    with_decorator,
    disabled,
    ...rest
  } = props;
  const has_story_count = is_num(story_count);
  const has_follower_count = is_num(follower_count);

  return (
    <Chip
      {...rest}
      as={NextLink}
      className={clsx(
        "flex-center",
        "t-regular",
        styles["tag-chip"],
        className
      )}
      decorator={with_decorator ? <HashIcon data-testid={"hash-icon"} /> : null}
      disabled={disabled}
      href={`/tag/${value}`}
      title={`Explore #${value}`}
      type={"clickable"}
      variant={"soft"}
    >
      <span className={"ellipsis"}>{value}</span>
      {has_story_count || has_follower_count ? <Grow /> : null}
      {has_story_count && (
        <Typography
          aria-label={`${story_count} ${
            story_count === 1 ? "story" : "stories"
          }`}
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
          {abbreviate_number(story_count)}
        </Typography>
      )}
      {has_follower_count && (
        <Typography
          aria-label={`${follower_count} ${
            follower_count === 1 ? "follower" : "followers"
          }`}
          as={"span"}
          className={clsx(
            "flex-center",
            "t-medium",
            !disabled && "t-minor",
            styles.stat
          )}
          data-first-child={String(typeof story_count === "undefined")}
          level={"body3"}
        >
          <UsersIcon />
          {abbreviate_number(follower_count)}
        </Typography>
      )}
    </Chip>
  );
};

export default TagChip;
