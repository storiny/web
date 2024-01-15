import { ImageSize } from "@storiny/shared";
import { clsx } from "clsx";
import NextLink from "next/link";
import React from "react";

import AspectRatio from "~/components/aspect-ratio";
import IconButton from "~/components/icon-button";
import Image from "~/components/image";
import Link from "~/components/link";
import Typography from "~/components/typography";
import CommentIcon from "~/icons/comment";
import ExternalLinkIcon from "~/icons/external-link";
import HeartIcon from "~/icons/heart";
import ImageIcon from "~/icons/image";
import ReadsIcon from "~/icons/reads";
import css from "~/theme/main.module.scss";
import { abbreviate_number } from "~/utils/abbreviate-number";

import styles from "./story-card.module.scss";
import { StoryCardProps } from "./story-card.props";

const StoryCard = (props: StoryCardProps): React.ReactElement => {
  const { story, className, ...rest } = props;
  const href = `/${story.user?.username || "story"}/${story.slug ?? story.id}`;

  return (
    <article {...rest} className={clsx(styles["story-card"], className)}>
      <AspectRatio
        aria-label={"Read this story"}
        as={NextLink}
        className={clsx(css["full-w"], styles.splash)}
        href={href}
        ratio={1.76}
        target={"_blank"}
        title={"Read this story"}
      >
        {!story.splash_id ? (
          <div className={clsx(css["flex-center"], styles.placeholder)}>
            <ImageIcon />
          </div>
        ) : (
          <Image
            alt={""}
            hex={story.splash_hex}
            img_key={story.splash_id}
            size={ImageSize.W_320}
          />
        )}
        <IconButton
          aria-label={"Read this story"}
          className={clsx("force-light-mode", styles["overlay-button"])}
        >
          <ExternalLinkIcon />
        </IconButton>
      </AspectRatio>

      <div className={clsx(css["flex-col"], styles.meta)}>
        <Link
          className={css["t-medium"]}
          fixed_color
          href={href}
          level={"body2"}
          target={"_blank"}
          title={story.title}
        >
          {story.title}
        </Link>
        {story.description && (
          <Typography className={css["t-minor"]} level={"body2"}>
            {story.description}
          </Typography>
        )}
        <footer className={clsx(css["flex"], styles.footer)}>
          <Typography
            as={"span"}
            className={clsx(
              css["t-medium"],
              css["t-minor"],
              css["flex-center"],
              styles.stat
            )}
            level={"body2"}
            title={`${abbreviate_number(story.read_count)} ${
              story.read_count === 1 ? "read" : "reads"
            }`}
          >
            <ReadsIcon />
            {abbreviate_number(story.read_count)}
          </Typography>
          <Typography
            as={"span"}
            className={clsx(
              css["t-medium"],
              css["t-minor"],
              css["flex-center"],
              styles.stat
            )}
            level={"body2"}
            title={`${abbreviate_number(story.like_count)} ${
              story.like_count === 1 ? "like" : "likes"
            }`}
          >
            <HeartIcon />
            {abbreviate_number(story.like_count)}
          </Typography>
          <Typography
            as={"span"}
            className={clsx(
              css["t-medium"],
              css["t-minor"],
              css["flex-center"],
              styles.stat
            )}
            level={"body2"}
            title={`${abbreviate_number(story.comment_count)} ${
              story.comment_count === 1 ? "comment" : "comments"
            }`}
          >
            <CommentIcon />
            {abbreviate_number(story.comment_count)}
          </Typography>
        </footer>
      </div>
    </article>
  );
};

export default StoryCard;
