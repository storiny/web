import { ImageSize } from "@storiny/shared";
import { clsx } from "clsx";
import NextLink from "next/link";
import React from "react";

import AspectRatio from "~/components/AspectRatio";
import IconButton from "~/components/IconButton";
import Image from "~/components/Image";
import Link from "~/components/Link";
import Typography from "~/components/Typography";
import CommentIcon from "~/icons/Comment";
import ExternalLinkIcon from "~/icons/ExternalLink";
import HeartIcon from "~/icons/Heart";
import ImageIcon from "~/icons/Image";
import ReadsIcon from "~/icons/Reads";
import { abbreviateNumber } from "~/utils/abbreviateNumber";

import styles from "./StoryCard.module.scss";
import { StoryCardProps } from "./StoryCard.props";

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
            imgId={story.splash_id}
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
          fixedColor
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
            title={`${abbreviateNumber(story.stats.read_count)} ${
              story.stats.read_count === 1 ? "read" : "reads"
            }`}
          >
            <ReadsIcon />
            {abbreviateNumber(story.stats.read_count)}
          </Typography>
          <Typography
            as={"span"}
            className={clsx("t-medium", "t-minor", "flex-center", styles.stat)}
            level={"body2"}
            title={`${abbreviateNumber(story.stats.like_count)} ${
              story.stats.like_count === 1 ? "like" : "likes"
            }`}
          >
            <HeartIcon />
            {abbreviateNumber(story.stats.like_count)}
          </Typography>
          <Typography
            as={"span"}
            className={clsx("t-medium", "t-minor", "flex-center", styles.stat)}
            level={"body2"}
            title={`${abbreviateNumber(story.stats.comment_count)} ${
              story.stats.comment_count === 1 ? "comment" : "comments"
            }`}
          >
            <CommentIcon />
            {abbreviateNumber(story.stats.comment_count)}
          </Typography>
        </footer>
      </div>
    </article>
  );
};

export default StoryCard;
