"use client";

import clsx from "clsx";
import React from "react";

import Link from "src/components/link";
import Typography from "src/components/typography";
import Persona from "src/entities/persona";
import TrendingUpIcon from "src/icons/trending-up";

import styles from "./popular-story.module.scss";
import { PopularStoryProps } from "./popular-story.props";

const PopularStory = (props: PopularStoryProps): React.ReactElement | null => {
  const { story } = props;
  const { title, slug, user } = story;

  if (!user) {
    return null;
  }

  return (
    <article className={clsx("flex-col", styles["popular-story"])}>
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
        primary_text={
          <span className={clsx("flex-center", styles["primary-text"])}>
            <Link
              className={clsx("t-medium")}
              fixed_color
              href={`/${user.username}`}
              level={"body2"}
            >
              {user.name}
            </Link>
            <Typography
              aria-hidden
              as={"span"}
              className={"t-muted"}
              level={"body2"}
            >
              &bull;
            </Typography>
            <Typography
              as={"span"}
              className={clsx(
                "t-minor",
                "t-medium",
                "flex-center",
                styles["trending-text"]
              )}
              level={"body2"}
            >
              <TrendingUpIcon size={14} />
              {/* TODO: Change this */}
              1.2k
            </Typography>
          </span>
        }
        size={"sm"}
      />
    </article>
  );
};

export default PopularStory;
