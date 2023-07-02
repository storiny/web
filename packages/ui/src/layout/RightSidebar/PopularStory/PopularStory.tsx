"use client";

import clsx from "clsx";
import React from "react";

import Link from "~/components/Link";
import Typography from "~/components/Typography";
import Persona from "~/entities/Persona";
import TrendingUpIcon from "~/icons/TrendingUp";

import styles from "./PopularStory.module.scss";
import { PopularStoryProps } from "./PopularStory.props";

const PopularStory = (props: PopularStoryProps) => {
  const { story } = props;
  const { title, slug, user } = story;

  return (
    <article className={clsx("flex-col", styles["popular-story"])}>
      <Typography as={"h2"} level={"h6"}>
        <Link fixedColor href={`/${user.username}/${slug}`}>
          {title}
        </Link>
      </Typography>
      <Persona
        avatar={{
          alt: `${user.name}'s avatar`,
          avatarId: user.avatar_id,
          label: user.name,
          hex: user.avatar_hex
        }}
        primaryText={
          <span className={clsx("flex-center", styles["primary-text"])}>
            <Link
              className={clsx("t-medium")}
              fixedColor
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
              &#x2022;
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
