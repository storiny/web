import { ImageSize } from "@storiny/shared";
import { clsx } from "clsx";
import NextLink from "next/link";
import React from "react";

import AspectRatio from "src/components/aspect-ratio";
import IconButton from "src/components/icon-button";
import Image from "src/components/image";
import Link from "src/components/link";
import Typography from "src/components/typography";
import CommentIcon from "src/icons/comment";
import ExternalLinkIcon from "src/icons/external-link";
import HeartIcon from "src/icons/heart";
import ImageIcon from "src/icons/image";
import ReadsIcon from "src/icons/reads";
import { abbreviate_number } from "src/utils/abbreviate-number";

import styles from "./story-card.module.scss";
import { StoryCardProps } from "./story-card.props";

const StoryCard = (props: StoryCardProps): React.ReactElement => {
  const { story, className, ...rest } = props;
  const href = `/${story.user?.username || "story"}/${story.slug}`;

  return (
    <article {...rest} className={clsx(styles["story-card"], className)}>
      <AspectRatio
        aria-label={"Read this story"}
        as={NextLink}
        className={clsx("full-w", styles.splash)}
        href={href}
        ratio={1.76}
        target={"_blank"}
        title={"Read this story"}
      >
        {!story.splash_id ? (
          <div className={clsx("flex-center", styles.placeholder)}>
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

      <div className={clsx("flex-col", styles.meta)}>
        <Link
          className={"t-medium"}
          fixed_color
          href={href}
          level={"body2"}
          target={"_blank"}
          title={story.title}
        >
          {story.title}
        </Link>
        {story.description && (
          <Typography className={"t-minor"} level={"body2"}>
            {story.description}
          </Typography>
        )}
        <footer className={clsx("flex", styles.footer)}>
          <Typography
            as={"span"}
            className={clsx("t-medium", "t-minor", "flex-center", styles.stat)}
            level={"body2"}
            title={`${abbreviate_number(story.stats.read_count)} ${
              story.stats.read_count === 1 ? "read" : "reads"
            }`}
          >
            <ReadsIcon />
            {abbreviate_number(story.stats.read_count)}
          </Typography>
          <Typography
            as={"span"}
            className={clsx("t-medium", "t-minor", "flex-center", styles.stat)}
            level={"body2"}
            title={`${abbreviate_number(story.stats.like_count)} ${
              story.stats.like_count === 1 ? "like" : "likes"
            }`}
          >
            <HeartIcon />
            {abbreviate_number(story.stats.like_count)}
          </Typography>
          <Typography
            as={"span"}
            className={clsx("t-medium", "t-minor", "flex-center", styles.stat)}
            level={"body2"}
            title={`${abbreviate_number(story.stats.comment_count)} ${
              story.stats.comment_count === 1 ? "comment" : "comments"
            }`}
          >
            <CommentIcon />
            {abbreviate_number(story.stats.comment_count)}
          </Typography>
        </footer>
      </div>
    </article>
  );
};

export default StoryCard;
