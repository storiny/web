"use client";

import { ImageSize } from "@storiny/shared";
import clsx from "clsx";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import React from "react";

import AspectRatio from "~/components/AspectRatio";
import Button from "~/components/Button";
import Chip from "~/components/Chip";
import Grow from "~/components/Grow";
import IconButton from "~/components/IconButton";
import Image from "~/components/Image";
import Link from "~/components/Link";
import NoSsr from "~/components/NoSsr";
import Spacer from "~/components/Spacer";
import Tooltip from "~/components/Tooltip";
import Typography from "~/components/Typography";
import Persona from "~/entities/Persona";
import Tag from "~/entities/Tag";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import BookmarkIcon from "~/icons/Bookmark";
import BookmarkPlusIcon from "~/icons/BookmarkPlus";
import ClockIcon from "~/icons/Clock";
import ReadsIcon from "~/icons/Reads";
import XIcon from "~/icons/X";
import { selectUser } from "~/redux/features/auth/selectors";
import {
  selectBlock,
  selectBookmark,
  selectLikedStory
} from "~/redux/features/entities/selectors";
import {
  overwriteBookmark,
  overwriteLikedStory,
  syncWithStory,
  toggleBookmark
} from "~/redux/features/entities/slice";
import { useAppDispatch, useAppSelector } from "~/redux/hooks";
import { breakpoints } from "~/theme/breakpoints";
import { abbreviateNumber } from "~/utils/abbreviateNumber";
import { DateFormat, formatDate } from "~/utils/formatDate";
import { getCdnUrl } from "~/utils/getCdnUrl";
import { getReadTime } from "~/utils/getReadTime";

import Actions from "./Actions";
import styles from "./Story.module.scss";
import { StoryProps } from "./Story.props";

const Story = (props: StoryProps): React.ReactElement => {
  const { className, story, enableSsr, showUnlikeButton, ...rest } = props;
  const router = useRouter();
  const isMobile = useMediaQuery(breakpoints.down("mobile"));
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const isBookmarked = useAppSelector(selectBookmark(story.id));
  const isLiked = useAppSelector(selectLikedStory(story.id));
  const isUserBlocked = useAppSelector(selectBlock(story.user_id));
  const [collapsed, setCollapsed] = React.useState(isUserBlocked);
  const storyUrl = `/${story.user.username}/${story.slug}`;

  React.useEffect(() => {
    dispatch(syncWithStory(story));
  }, [dispatch, story]);

  // Collapse on block
  React.useEffect(() => {
    setCollapsed(isUserBlocked);
  }, [isUserBlocked]);

  const unlikeStory = (): void => {
    dispatch(overwriteLikedStory([story.id, false]));
  };

  return (
    <NoSsr disabled={enableSsr}>
      {collapsed ? (
        <div className={clsx("flex-col", "flex-center")}>
          <Typography level={"body2"}>
            You have blocked the writer of this story.
          </Typography>
          <Spacer orientation={"vertical"} size={2} />
          <Button onClick={(): void => setCollapsed(false)} variant={"hollow"}>
            View
          </Button>
          <Spacer orientation={"vertical"} size={2} />
        </div>
      ) : (
        <article
          className={clsx("flex-col", styles.story, className)}
          {...rest}
        >
          <div className={clsx("flex", styles.main)}>
            <div className={clsx("flex-col", styles.meta)}>
              <Typography
                as={NextLink}
                className={clsx("focusable", styles.title)}
                href={storyUrl}
                level={"h2"}
              >
                {story.title}
              </Typography>
              <Persona
                avatar={{
                  avatarId: story.user.avatar_id,
                  hex: story.user.avatar_hex,
                  alt: "",
                  className: "focusable",
                  // @ts-expect-error polymorphic prop
                  href: `/${story.user.username}`,
                  title: `View ${story.user.name}'s profile`,
                  as: NextLink
                }}
                className={styles.persona}
                primaryText={
                  <span className={"flex"} style={{ gap: "4px" }}>
                    <Link
                      className={"t-medium"}
                      href={`/${story.user.username}`}
                      level={"body2"}
                    >
                      {story.user.name}
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
                      as={"time"}
                      className={"t-minor"}
                      dateTime={story.created_at}
                      level={"body2"}
                      title={formatDate(story.created_at)}
                    >
                      {formatDate(
                        story.created_at,
                        DateFormat.RELATIVE_CAPITALIZED
                      )}
                    </Typography>
                  </span>
                }
                size={"sm"}
              />
              <Typography
                as={NextLink}
                className={clsx("t-minor", styles.description)}
                href={storyUrl}
                level={"body2"}
                tabIndex={-1}
              >
                {story.description}
              </Typography>
            </div>
            {story.splash_id && (
              <AspectRatio
                aria-label={"Read this story"}
                as={isMobile ? undefined : NextLink}
                className={styles.splash}
                ratio={16 / 9}
                tabIndex={-1}
                // Use onClick to avoid nesting anchor inside another anchor
                {...(isMobile
                  ? {
                      onClick: () => router.push(storyUrl)
                    }
                  : { href: storyUrl })}
              >
                <Image
                  alt={""}
                  hex={story.splash_hex}
                  imgId={story.splash_id}
                  slotProps={{
                    image: {
                      sizes: [
                        "(min-width: 800px) 320px",
                        "(min-width: 650px) 256px",
                        "100vw"
                      ].join(","),
                      srcSet: [
                        `${getCdnUrl(story.splash_id, ImageSize.W_256)} 256w`,
                        `${getCdnUrl(story.splash_id, ImageSize.W_320)} 320w`,
                        `${getCdnUrl(story.splash_id, ImageSize.W_640)} 640w`
                      ].join(",")
                    }
                  }}
                />
                {isMobile && (
                  <span className={clsx("flex", styles["mobile-actions"])}>
                    {showUnlikeButton && isLiked ? (
                      <IconButton
                        aria-label={"Unlike this story"}
                        checkAuth
                        className={"force-light-mode"}
                        onClick={unlikeStory}
                        size={"lg"}
                      >
                        <XIcon />
                      </IconButton>
                    ) : null}
                    <IconButton
                      aria-label={`${
                        isBookmarked ? "Un-bookmark" : "Bookmark"
                      } this story`}
                      checkAuth
                      className={"force-light-mode"}
                      onClick={(): void => {
                        dispatch(toggleBookmark(story.id));
                      }}
                      size={"lg"}
                    >
                      {isBookmarked ? (
                        <BookmarkIcon noStroke />
                      ) : (
                        <BookmarkPlusIcon />
                      )}
                    </IconButton>
                    <Actions story={story} />
                  </span>
                )}
              </AspectRatio>
            )}
          </div>
          <footer className={clsx("flex", styles.footer)}>
            <Typography
              aria-label={`${getReadTime(
                story.word_count,
                user?.wpm
              )} min read`}
              as={"span"}
              className={clsx(
                "flex-center",
                "t-medium",
                "t-minor",
                styles.stat
              )}
              level={"body2"}
              title={`${getReadTime(story.word_count, user?.wpm)} min read`}
            >
              <ClockIcon />
              {getReadTime(story.word_count, user?.wpm)} min
            </Typography>
            <Typography
              aria-hidden
              as={"span"}
              className={"t-muted"}
              level={"body2"}
            >
              &#x2022;
            </Typography>
            <Typography
              aria-label={`${story.stats.read_count} reads`}
              as={"span"}
              className={clsx(
                "flex-center",
                "t-medium",
                "t-minor",
                styles.stat
              )}
              level={"body2"}
              title={`${abbreviateNumber(story.stats.read_count)} reads`}
            >
              <ReadsIcon />
              {abbreviateNumber(story.stats.read_count)}
            </Typography>
            {story.tags.length ? (
              <>
                {isMobile ? (
                  <Grow />
                ) : (
                  <Typography
                    aria-hidden
                    as={"span"}
                    className={"t-muted"}
                    level={"body2"}
                  >
                    &#x2022;
                  </Typography>
                )}
                <div className={clsx("flex", styles["tags-container"])}>
                  {story.tags.slice(0, isMobile ? 1 : 2).map((tag) => (
                    <Tag
                      key={tag.id}
                      size={isMobile ? "lg" : "md"}
                      value={tag.name}
                    />
                  ))}
                  {story.tags.length > (isMobile ? 1 : 2) && (
                    <Chip variant={"soft"}>
                      +{story.tags.length - (isMobile ? 1 : 2)}
                    </Chip>
                  )}
                </div>
              </>
            ) : null}
            {!isMobile && (
              <>
                <Grow />
                <div className={clsx("flex", styles.actions)}>
                  {showUnlikeButton && isLiked ? (
                    <Tooltip content={"Unlike this story"}>
                      <IconButton
                        aria-label={"Unlike this story"}
                        checkAuth
                        onClick={unlikeStory}
                        variant={"ghost"}
                      >
                        <XIcon />
                      </IconButton>
                    </Tooltip>
                  ) : null}
                  <Tooltip
                    content={`${
                      isBookmarked ? "Un-bookmark" : "Bookmark"
                    } this story`}
                  >
                    <IconButton
                      aria-label={`${
                        isBookmarked ? "Un-bookmark" : "Bookmark"
                      } this story`}
                      checkAuth
                      onClick={(): void => {
                        dispatch(toggleBookmark(story.id));
                      }}
                      variant={"ghost"}
                    >
                      {isBookmarked ? (
                        <BookmarkIcon noStroke />
                      ) : (
                        <BookmarkPlusIcon />
                      )}
                    </IconButton>
                  </Tooltip>
                  <Actions story={story} />
                </div>
              </>
            )}
          </footer>
        </article>
      )}
    </NoSsr>
  );
};

export default React.memo(Story);
