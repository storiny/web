"use client";

import clsx from "clsx";
import NextLink from "next/link";
import React from "react";

import Button from "~/components/Button";
import IconButton from "~/components/IconButton";
import Link from "~/components/Link";
import NoSsr from "~/components/NoSsr";
import Spacer from "~/components/Spacer";
import Typography from "~/components/Typography";
import CommentParser from "~/entities/Comment/Parser";
import Persona from "~/entities/Persona";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import ExternalLinkIcon from "~/icons/ExternalLink";
import HeartIcon from "~/icons/Heart";
import ReplyIcon from "~/icons/Reply";
import { selectBlock } from "~/redux/features/entities/selectors";
import { syncWithComment } from "~/redux/features/entities/slice";
import { useAppDispatch, useAppSelector } from "~/redux/hooks";
import { breakpoints } from "~/theme/breakpoints";
import { abbreviateNumber } from "~/utils/abbreviateNumber";
import { DateFormat, formatDate } from "~/utils/formatDate";

import Actions from "./Actions";
import styles from "./Comment.module.scss";
import { CommentProps } from "./Comment.props";

const Comment = (props: CommentProps): React.ReactElement => {
  const {
    isStatic,
    isExtended,
    hidden: hiddenProp,
    className,
    comment,
    enableSsr,
    ...rest
  } = props;
  const dispatch = useAppDispatch();
  const isMobile = useMediaQuery(breakpoints.down("mobile"));
  const isUserBlocked = useAppSelector(selectBlock(comment.user_id));
  const [hidden, setHidden] = React.useState(!hiddenProp);
  const [collapsed, setCollapsed] = React.useState(isUserBlocked);
  const commentUrl = `/${comment.story?.user?.username || "story"}/${
    comment.story?.slug || comment.story_id
  }/comments/${comment.id}`;

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
          <div className={clsx("flex-center", styles.header)}>
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
                </Typography>
              }
            />
            <Actions comment={comment} />
          </div>
          {hidden ? (
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
                <CommentParser content={comment.rendered_content} />
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
                      aria-label={`${abbreviateNumber(
                        comment.like_count
                      )} likes`}
                      decorator={<HeartIcon />}
                      size={isMobile ? "md" : "sm"}
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
