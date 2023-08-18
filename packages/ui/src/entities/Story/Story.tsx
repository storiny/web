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
import TagChip from "~/entities/TagChip";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import BookmarkIcon from "~/icons/Bookmark";
import BookmarkPlusIcon from "~/icons/BookmarkPlus";
import ClockIcon from "~/icons/Clock";
import CommentIcon from "~/icons/Comment";
import HeartIcon from "~/icons/Heart";
import ReadsIcon from "~/icons/Reads";
import TrashIcon from "~/icons/Trash";
import XIcon from "~/icons/X";
import { falseAction } from "~/redux/features";
import { selectUser } from "~/redux/features/auth/selectors";
import {
  selectBlock,
  selectBookmark,
  selectLikedStory
} from "~/redux/features/entities/selectors";
import {
  setBookmark,
  setLikedStory,
  syncWithStory
} from "~/redux/features/entities/slice";
import { useAppDispatch, useAppSelector } from "~/redux/hooks";
import { breakpoints } from "~/theme/breakpoints";
import { abbreviateNumber } from "~/utils/abbreviateNumber";
import { DateFormat, formatDate } from "~/utils/formatDate";
import { getCdnUrl } from "~/utils/getCdnUrl";
import { getReadTime } from "~/utils/getReadTime";

import Actions, { RestoreAction } from "./Actions";
import styles from "./Story.module.scss";
import { StoryProps } from "./Story.props";

/**
 * Returns the story URL
 * @param props Story props
 */
const getStoryUrl = (props: StoryProps): string => {
  const { story, isDeleted, isDraft } = props;

  if (isDraft) {
    return `/me/content/drafts/${story.id}`;
  }

  if (isDeleted) {
    return `/me/content/deleted/${story.id}`;
  }

  return `/${story.user?.username}/${story.slug}`;
};

// Meta

const Meta = (props: StoryProps): React.ReactElement | null => {
  const { isExtended, isDeleted, isDraft, story } = props;
  const isMobile = useMediaQuery(breakpoints.down("mobile"));

  return isDeleted ? (
    isMobile ? (
      <Spacer orientation={"vertical"} size={0.5} />
    ) : (
      <Typography
        as={"time"}
        className={clsx("flex", "t-minor", "t-medium", styles["deleted-label"])}
        dateTime={story.deleted_at!}
        level={"body2"}
        title={formatDate(story.deleted_at!)}
      >
        <TrashIcon />
        <Spacer size={0.75} />
        <span>
          Deleted {formatDate(story.deleted_at!, DateFormat.RELATIVE)}
        </span>
      </Typography>
    )
  ) : isExtended ? (
    isMobile ? (
      <Spacer orientation={"vertical"} size={0.5} />
    ) : (
      <Typography
        as={"time"}
        className={clsx("t-minor", "t-medium")}
        dateTime={story.published_at!}
        level={"body2"}
        title={formatDate(story.published_at!)}
      >
        Published {formatDate(story.published_at!, DateFormat.RELATIVE)}
      </Typography>
    )
  ) : isDraft ? (
    isMobile ? (
      <Spacer orientation={"vertical"} size={0.5} />
    ) : (
      <Typography
        as={"time"}
        className={clsx("t-minor", "t-medium")}
        dateTime={story.edited_at || story.created_at}
        level={"body2"}
        title={formatDate(story.edited_at || story.created_at)}
      >
        Edited{" "}
        {formatDate(story.edited_at || story.created_at, DateFormat.RELATIVE)}
      </Typography>
    )
  ) : (
    <Persona
      avatar={{
        avatarId: story.user?.avatar_id,
        hex: story.user?.avatar_hex,
        alt: "",
        className: "focusable",
        // @ts-expect-error polymorphic prop
        href: `/${story.user.username}`,
        title: `View ${story.user?.name}'s profile`,
        as: NextLink
      }}
      className={styles.persona}
      primaryText={
        <span className={"flex"} style={{ gap: "4px" }}>
          <Link
            className={"t-medium"}
            href={`/${story.user?.username}`}
            level={"body2"}
          >
            {story.user?.name}
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
            as={"time"}
            className={"t-minor"}
            dateTime={story.published_at || story.created_at}
            level={"body2"}
            title={formatDate(story.published_at || story.created_at)}
          >
            {formatDate(
              story.published_at || story.created_at,
              DateFormat.RELATIVE_CAPITALIZED
            )}
          </Typography>
        </span>
      }
      size={"sm"}
    />
  );
};

// Splash

const Splash = (props: StoryProps): React.ReactElement => {
  const { isExtended, isDeleted, isDraft, showUnlikeButton, story } = props;
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isMobile = useMediaQuery(breakpoints.down("mobile"));
  const isBookmarked = useAppSelector(selectBookmark(story.id));
  const isLiked = useAppSelector(selectLikedStory(story.id));
  const storyUrl = getStoryUrl(props);
  const isSmall = isExtended || isDeleted || isDraft;
  const showInteractiveButtons = Boolean(!isExtended && !isDeleted && !isDraft);

  return (
    <AspectRatio
      aria-label={"Read this story"}
      as={isMobile ? undefined : NextLink}
      className={clsx(styles.splash, isSmall && styles.small)}
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
          {!isExtended && (
            <React.Fragment>
              {showInteractiveButtons && showUnlikeButton && isLiked ? (
                <IconButton
                  aria-label={"Unlike this story"}
                  checkAuth
                  className={"force-light-mode"}
                  onClick={(): void => {
                    dispatch(setLikedStory([story.id, falseAction]));
                  }}
                  size={"lg"}
                >
                  <XIcon />
                </IconButton>
              ) : null}
              {showInteractiveButtons && (
                <IconButton
                  aria-label={`${
                    isBookmarked ? "Un-bookmark" : "Bookmark"
                  } this story`}
                  checkAuth
                  className={"force-light-mode"}
                  onClick={(): void => {
                    dispatch(setBookmark([story.id]));
                  }}
                  size={"lg"}
                >
                  {isBookmarked ? (
                    <BookmarkIcon noStroke />
                  ) : (
                    <BookmarkPlusIcon />
                  )}
                </IconButton>
              )}
            </React.Fragment>
          )}
          {isDeleted ? (
            <RestoreAction isDraft={isDraft} story={story} />
          ) : (
            <Actions isDraft={isDraft} isExtended={isExtended} story={story} />
          )}
        </span>
      )}
    </AspectRatio>
  );
};

// Footer

const Footer = (props: StoryProps): React.ReactElement => {
  const { isExtended, isDeleted, isDraft, story, showUnlikeButton } = props;
  const isMobile = useMediaQuery(breakpoints.down("mobile"));
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const isBookmarked = useAppSelector(selectBookmark(story.id));
  const isLiked = useAppSelector(selectLikedStory(story.id));
  const showWordCount = isDraft || isDeleted;
  const showTags = Boolean(!isDraft && !isDeleted);
  const showInteractiveButtons = Boolean(!isExtended && !isDeleted && !isDraft);

  return (
    <footer className={clsx("flex", styles.footer)}>
      {showWordCount ? (
        <Typography
          as={"span"}
          className={clsx("flex-center", "t-medium", "t-minor", styles.stat)}
          level={"body2"}
          title={story.word_count.toLocaleString()}
        >
          {abbreviateNumber(story.word_count)} words
          {isMobile && (
            <React.Fragment>
              <Typography
                aria-hidden
                as={"span"}
                className={"t-muted"}
                level={"body2"}
              >
                &bull;
              </Typography>
              {isDeleted ? (
                <Typography
                  as={"time"}
                  className={clsx("t-minor", "t-medium")}
                  dateTime={story.deleted_at!}
                  level={"body2"}
                  title={formatDate(story.deleted_at!)}
                >
                  Deleted {formatDate(story.deleted_at!, DateFormat.RELATIVE)}
                </Typography>
              ) : (
                <Typography
                  as={"time"}
                  className={clsx("t-minor", "t-medium")}
                  dateTime={story.edited_at || story.created_at}
                  level={"body2"}
                  title={formatDate(story.edited_at || story.created_at)}
                >
                  Edited{" "}
                  {formatDate(
                    story.edited_at || story.created_at,
                    DateFormat.RELATIVE
                  )}
                </Typography>
              )}
            </React.Fragment>
          )}
        </Typography>
      ) : (
        <React.Fragment>
          {!isExtended && (
            <React.Fragment>
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
                &bull;
              </Typography>
            </React.Fragment>
          )}
          <Typography
            aria-label={`${story.stats.read_count} reads`}
            as={"span"}
            className={clsx("flex-center", "t-medium", "t-minor", styles.stat)}
            level={"body2"}
            title={`${abbreviateNumber(story.stats.read_count)} reads`}
          >
            <ReadsIcon />
            {abbreviateNumber(story.stats.read_count)}
          </Typography>
          {isExtended && (
            <React.Fragment>
              {story.stats.like_count && (
                <React.Fragment>
                  <Typography
                    aria-hidden
                    as={"span"}
                    className={"t-muted"}
                    level={"body2"}
                  >
                    &bull;
                  </Typography>
                  <Typography
                    aria-label={`${story.stats.like_count} likes`}
                    as={"span"}
                    className={clsx(
                      "flex-center",
                      "t-medium",
                      "t-minor",
                      styles.stat
                    )}
                    level={"body2"}
                    title={`${abbreviateNumber(story.stats.like_count)} likes`}
                  >
                    <HeartIcon />
                    {abbreviateNumber(story.stats.like_count)}
                  </Typography>
                </React.Fragment>
              )}
              {story.stats.comment_count && (
                <React.Fragment>
                  <Typography
                    aria-hidden
                    as={"span"}
                    className={"t-muted"}
                    level={"body2"}
                  >
                    &bull;
                  </Typography>
                  <Typography
                    aria-label={`${story.stats.comment_count} comments`}
                    as={"span"}
                    className={clsx(
                      "flex-center",
                      "t-medium",
                      "t-minor",
                      styles.stat
                    )}
                    level={"body2"}
                    title={`${abbreviateNumber(
                      story.stats.comment_count
                    )} comments`}
                  >
                    <CommentIcon />
                    {abbreviateNumber(story.stats.comment_count)}
                  </Typography>
                </React.Fragment>
              )}
            </React.Fragment>
          )}
        </React.Fragment>
      )}
      {showTags && story.tags.length ? (
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
              &bull;
            </Typography>
          )}
          <div className={clsx("flex", styles["tags-container"])}>
            {story.tags.slice(0, isMobile ? 1 : 2).map((tag) => (
              <TagChip
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
            {showInteractiveButtons && (
              <React.Fragment>
                {showUnlikeButton && isLiked ? (
                  <Tooltip content={"Unlike this story"}>
                    <IconButton
                      aria-label={"Unlike this story"}
                      checkAuth
                      onClick={(): void => {
                        dispatch(setLikedStory([story.id, falseAction]));
                      }}
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
                      dispatch(setBookmark([story.id]));
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
              </React.Fragment>
            )}
            {isDeleted ? (
              <RestoreAction isDraft={isDraft} story={story} />
            ) : (
              <Actions
                isDraft={isDraft}
                isExtended={isExtended}
                story={story}
              />
            )}
          </div>
        </>
      )}
    </footer>
  );
};

const Story = (props: StoryProps): React.ReactElement => {
  const {
    isExtended,
    isDeleted,
    isDraft,
    className,
    story,
    enableSsr,
    ...rest
  } = props;
  const dispatch = useAppDispatch();
  const isUserBlocked = useAppSelector(selectBlock(story.user_id));
  const [collapsed, setCollapsed] = React.useState(isUserBlocked);
  const storyUrl = getStoryUrl(props);
  const isSmall = isExtended || isDeleted || isDraft;

  React.useEffect(() => {
    dispatch(syncWithStory(story));
  }, [dispatch, story]);

  // Collapse on block
  React.useEffect(() => {
    setCollapsed(isUserBlocked);
  }, [isUserBlocked]);

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
          {...rest}
          className={clsx("flex-col", styles.story, className)}
        >
          <div className={clsx("flex", styles.main)}>
            <div className={clsx("flex-col", styles.meta)}>
              <Typography
                as={NextLink}
                className={clsx(
                  "focusable",
                  styles.title,
                  isSmall && styles.small
                )}
                href={storyUrl}
                level={"h2"}
              >
                {story.title}
              </Typography>
              <Meta {...props} />
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
            {story.splash_id && <Splash {...props} />}
          </div>
          <Footer {...props} />
        </article>
      )}
    </NoSsr>
  );
};

export default React.memo(Story);
