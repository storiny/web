import { is_num } from "@storiny/shared/src/utils/is-num";
import clsx from "clsx";
import NextLink from "next/link";
import React from "react";

import Chip from "~/components/chip";
import Grow from "~/components/grow";
import Typography from "~/components/typography";
import HashIcon from "~/icons/hash";
import StoriesIcon from "~/icons/stories";
import UsersIcon from "~/icons/users";
import css from "~/theme/main.module.scss";
import { abbreviate_number } from "~/utils/abbreviate-number";

import styles from "./tag-chip.module.scss";
import { TagChipProps } from "./tag-chip.props";

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
        css["flex-center"],
        css["t-regular"],
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
      <span className={css["ellipsis"]}>{value}</span>
      {has_story_count || has_follower_count ? <Grow /> : null}
      {has_story_count && (
        <Typography
          aria-label={`${story_count} ${
            story_count === 1 ? "story" : "stories"
          }`}
          as={"span"}
          className={clsx(css["flex-center"], styles.stat)}
          color={disabled ? "major" : "minor"}
          data-first-child={"true"}
          level={"body3"}
          weight={"medium"}
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
          className={clsx(css["flex-center"], styles.stat)}
          color={disabled ? "major" : "minor"}
          data-first-child={String(typeof story_count === "undefined")}
          level={"body3"}
          weight={"medium"}
        >
          <UsersIcon />
          {abbreviate_number(follower_count)}
        </Typography>
      )}
    </Chip>
  );
};

export default TagChip;
