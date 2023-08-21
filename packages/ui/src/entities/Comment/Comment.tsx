"use client";

import { ImageSize } from "@storiny/shared";
import clsx from "clsx";
import NextLink from "next/link";
import React from "react";

import AspectRatio from "~/components/AspectRatio";
import Button from "~/components/Button";
import IconButton from "~/components/IconButton";
import Image from "~/components/Image";
import Link from "~/components/Link";
import NoSsr from "~/components/NoSsr";
import Spacer from "~/components/Spacer";
import Typography from "~/components/Typography";
import Persona from "~/entities/Persona";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import ExternalLinkIcon from "~/icons/ExternalLink";
import HeartIcon from "~/icons/Heart";
import ReplyIcon from "~/icons/Reply";
import {
  selectBlock,
  selectLikedComment
} from "~/redux/features/entities/selectors";
import {
  setLikedComment,
  syncWithComment
} from "~/redux/features/entities/slice";
import { useAppDispatch, useAppSelector } from "~/redux/hooks";
import { breakpoints } from "~/theme/breakpoints";
import { abbreviateNumber } from "~/utils/abbreviateNumber";
import { DateFormat, formatDate } from "~/utils/formatDate";

import ResponseParser from "../common/ResponseParser";
import Actions from "./Actions";
import styles from "./Comment.module.scss";
import { CommentProps } from "./Comment.props";

const StoryPersona = (props: {
  created_at: string;
  edited_at: string | null;
  story: NonNullable<CommentProps["comment"]["story"]>;
}): React.ReactElement => {
  const { story, created_at, edited_at } = props;
  return (
    <div className={clsx("flex", styles["story-persona"])}>
      {story.splash_id && (
        <AspectRatio className={styles["story-splash"]} ratio={1.77}>
          <Image
            alt={""}
            hex={story.splash_hex}
            imgId={story.splash_id}
            size={ImageSize.W_64}
          />
        </AspectRatio>
      )}
      <div className={"flex-col"}>
        <Link
          className={"t-medium"}
          ellipsis
          fixedColor
          href={`/${story.user?.username || "story"}/${story.slug}`}
          level={"body2"}
        >
          {story.title}
        </Link>
        <Typography
          className={clsx("t-minor", "t-medium")}
          ellipsis
          level={"body3"}
        >
          {formatDate(created_at, DateFormat.RELATIVE_CAPITALIZED)}
          {edited_at && ` (edited)`}
        </Typography>
      </div>
    </div>
  );
};

const Comment = (props: CommentProps): React.ReactElement => {
  const {
    hideHiddenOverlay,
    isStatic,
    isExtended,
    className,
    comment,
    enableSsr,
    ...rest
  } = props;
  const dispatch = useAppDispatch();
  const isMobile = useMediaQuery(breakpoints.down("mobile"));
  const isUserBlocked = useAppSelector(selectBlock(comment.user_id));
  const isLiked = useAppSelector(selectLikedComment(comment.id));
  const [hidden, setHidden] = React.useState(Boolean(comment.hidden));
  const [collapsed, setCollapsed] = React.useState(isUserBlocked);
  const commentUrl = `/${comment.story?.user?.username || "story"}/${
    comment.story?.slug || comment.story_id
  }/comments/${comment.id}`;

  /**
   * Mutates the comment's visibility
   */
  const setHiddenImpl = React.useCallback(setHidden, [setHidden]);

  React.useEffect(() => {
    dispatch(syncWithComment(comment));
  }, [dispatch, comment]);

  // Collapse on block
  React.useEffect(() => {
    setCollapsed(isUserBlocked);
  }, [isUserBlocked]);

  return (
    <NoSsr disabled={enableSsr}>
      {collapsed ? (
        <div className={clsx("flex-col", "flex-center")}>
          <Typography level={"body2"}>You have blocked this user.</Typography>
          <Spacer orientation={"vertical"} size={2} />
          <Button onClick={(): void => setCollapsed(false)} variant={"hollow"}>
            View
          </Button>
          <Spacer orientation={"vertical"} size={2} />
        </div>
      ) : (
        <article
          {...rest}
          className={clsx("flex-col", styles.comment, className)}
        >
          <div className={clsx("flex", styles.header)}>
            {isExtended ? (
              <StoryPersona
                created_at={comment.created_at}
                edited_at={comment.edited_at}
                story={comment.story!}
              />
            ) : (
              <Persona
                avatar={{
                  alt: `${comment.user?.name}'s avatar`,
                  avatarId: comment.user?.avatar_id,
                  label: comment.user?.name,
                  hex: comment.user?.avatar_hex
                }}
                primaryText={
                  <Link
                    ellipsis
                    fixedColor
                    href={`/${comment.user?.username || ""}`}
                  >
                    {comment.user?.name}
                  </Link>
                }
                secondaryText={
                  <Typography
                    className={clsx("t-medium", "t-minor")}
                    ellipsis
                    level={"body3"}
                  >
                    <Link href={`/${comment.user?.username || ""}`}>
                      @{comment.user?.username}
                    </Link>{" "}
                    &bull;{" "}
                    {formatDate(
                      comment.created_at,
                      DateFormat.RELATIVE_CAPITALIZED
                    )}
                    {comment.edited_at && ` (edited)`}
                  </Typography>
                }
              />
            )}
            <Actions
              comment={comment}
              hidden={hidden}
              setHidden={setHiddenImpl}
            />
          </div>
          {hidden && !hideHiddenOverlay ? (
            <Typography
              className={clsx("t-minor", styles.hidden)}
              level={"body2"}
            >
              This comment has been hidden at the request of the story author.{" "}
              <Link
                className={"t-medium"}
                fixedColor
                href={"#"}
                onClick={(): void => setHidden(false)}
                underline={"always"}
              >
                View comment
              </Link>
            </Typography>
          ) : (
            <React.Fragment>
              <div className={clsx(styles.content)}>
                <ResponseParser content={comment.rendered_content} />
              </div>
              <footer className={clsx("flex-center")}>
                {isStatic || isExtended ? (
                  <React.Fragment>
                    <span className={clsx("flex-center", styles.stat)}>
                      <HeartIcon />{" "}
                      <Typography
                        className={clsx("t-medium", "t-minor")}
                        level={"body3"}
                      >
                        {abbreviateNumber(comment.like_count)}{" "}
                        {comment.like_count === 1 ? "like" : "likes"}
                      </Typography>
                    </span>
                    <Spacer size={1.5} />
                    <span className={clsx("flex-center", styles.stat)}>
                      <ReplyIcon />{" "}
                      <Typography
                        className={clsx("t-medium", "t-minor")}
                        level={"body3"}
                      >
                        {abbreviateNumber(comment.reply_count)}{" "}
                        {comment.reply_count === 1 ? "reply" : "replies"}
                      </Typography>
                    </span>
                    <Spacer className={"f-grow"} size={1.5} />
                    <IconButton
                      aria-label={"View comment"}
                      as={NextLink}
                      href={commentUrl}
                      size={"sm"}
                      title={"View comment"}
                      variant={"ghost"}
                    >
                      <ExternalLinkIcon />
                    </IconButton>
                  </React.Fragment>
                ) : (
                  <React.Fragment>
                    <Button
                      aria-label={`${
                        isLiked ? "Unlike" : "Like"
                      } comment (${abbreviateNumber(
                        comment.like_count
                      )} likes)`}
                      decorator={<HeartIcon noStroke={isLiked} />}
                      onClick={(): void => {
                        dispatch(setLikedComment([comment.id]));
                      }}
                      size={isMobile ? "md" : "sm"}
                      title={`${isLiked ? "Unlike" : "Like"} comment`}
                      variant={"ghost"}
                    >
                      {abbreviateNumber(comment.like_count)}
                    </Button>
                    <Button
                      aria-label={`${abbreviateNumber(
                        comment.reply_count
                      )} replies`}
                      decorator={<ReplyIcon />}
                      size={isMobile ? "md" : "sm"}
                      variant={"ghost"}
                    >
                      {abbreviateNumber(comment.reply_count)}
                    </Button>
                    <Spacer className={"f-grow"} size={1.5} />
                    <Button size={isMobile ? "md" : "sm"} variant={"ghost"}>
                      Reply
                    </Button>
                  </React.Fragment>
                )}
              </footer>
            </React.Fragment>
          )}
        </article>
      )}
    </NoSsr>
  );
};

export default React.memo(Comment);
