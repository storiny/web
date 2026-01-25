"use client";

import clsx from "clsx";
import React from "react";

import Link from "~/components/link";
import Typography from "~/components/typography";
import UserHoverCard from "~/components/user-hover-card";
import Persona from "~/entities/persona";
import TrendingUpIcon from "~/icons/trending-up";
import css from "~/theme/main.module.scss";
import { abbreviate_number } from "~/utils/abbreviate-number";

import styles from "./popular-story.module.scss";
import { PopularStoryProps } from "./popular-story.props";

const PopularStory = (props: PopularStoryProps): React.ReactElement | null => {
  const { story } = props;
  const { title, slug, user } = story;

  if (!user) {
    return null;
  }

  return (
    <article className={clsx(css["flex-col"], styles["popular-story"])}>
      <Typography as={"h2"} level={"h6"}>
        <Link fixed_color href={`/${user.username}/${slug}`}>
          {title}
        </Link>
      </Typography>
      <Persona
        avatar={{
          alt: `${user.name}'s avatar`,
          avatar_id: user.avatar_id,
          label: user.name,
          hex: user.avatar_hex
        }}
        component_props={{
          primary_text: { style: { minWidth: 0 } }
        }}
        primary_text={
          <span className={clsx(css["flex-center"], styles["primary-text"])}>
            <UserHoverCard identifier={user.id}>
              <Link
                className={clsx(css["t-medium"], css.ellipsis)}
                fixed_color
                href={`/${user.username}`}
                level={"body2"}
              >
                {user.name}
              </Link>
            </UserHoverCard>
            <Typography aria-hidden as={"span"} color={"muted"} level={"body2"}>
              &bull;
            </Typography>
            <Typography
              as={"span"}
              className={clsx(css["flex-center"], styles["trending-text"])}
              color={"minor"}
              level={"body2"}
              weight={"medium"}
            >
              <TrendingUpIcon size={14} />
              {abbreviate_number(story.read_count)}
            </Typography>
          </span>
        }
        size={"sm"}
      />
    </article>
  );
};

export default PopularStory;
