"use client";

import clsx from "clsx";
import NextLink from "next/link";
import React from "react";

import Button from "~/components/Button";
import Grow from "~/components/Grow";
import IconButton from "~/components/IconButton";
import Link from "~/components/Link";
import NoSsr from "~/components/NoSsr";
import Spacer from "~/components/Spacer";
import Typography from "~/components/Typography";
import Persona from "~/entities/Persona";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import ExternalLinkIcon from "~/icons/ExternalLink";
import HeartIcon from "~/icons/Heart";
import ReplyIcon from "~/icons/Reply";
import { selectUser } from "~/redux/features";
import { setLikedReply, syncWithReply } from "~/redux/features/entities/slice";
import { useAppDispatch, useAppSelector } from "~/redux/hooks";
import { breakpoints } from "~/theme/breakpoints";
import { abbreviateNumber } from "~/utils/abbreviateNumber";
import { DateFormat, formatDate } from "~/utils/formatDate";

import ResponseParser from "../common/ResponseParser";
import Actions from "./Actions";
import styles from "./Reply.module.scss";
import { ReplyProps } from "./Reply.props";

const Reply = (props: ReplyProps): React.ReactElement => {
  const { isStatic, className, reply, enableSsr, ...rest } = props;
  const dispatch = useAppDispatch();
  const isMobile = useMediaQuery(breakpoints.down("mobile"));
  const user = useAppSelector(selectUser);
  const isUserBlocked = useAppSelector(
    (state) => state.entities.blocks[reply.user_id]
  );
  const isLiked = useAppSelector(
    (state) => state.entities.likedReplies[reply.id]
  );
  const isSelf = user?.id === reply.user_id;
  const [hidden, setHidden] = React.useState(Boolean(reply.hidden));
  const [collapsed, setCollapsed] = React.useState(isUserBlocked);
  const replyUrl = `/${reply.comment?.story?.user?.username || "story"}/${
    reply.comment?.story?.slug || reply.comment?.story_id
  }/comments/${reply.comment?.id}?reply=${reply.id}`;

  /**
   * Mutates the reply's visibility
   */
  const setHiddenImpl = React.useCallback(setHidden, [setHidden]);

  React.useEffect(() => {
    dispatch(syncWithReply(reply));
  }, [dispatch, reply]);

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
          className={clsx("flex-col", styles.reply, className)}
        >
          <div className={clsx("flex", styles.header)}>
            <Persona
              avatar={
                isStatic && isSelf
                  ? {
                      children: <ReplyIcon />,
                      className: styles.avatar,
                      slotProps: {
                        fallback: {
                          className: styles.fallback
                        }
                      }
                    }
                  : {
                      alt: `${reply.user?.name}'s avatar`,
                      avatarId: reply.user?.avatar_id,
                      label: reply.user?.name,
                      hex: reply.user?.avatar_hex
                    }
              }
              primaryText={
                isStatic && isSelf ? (
                  <Link
                    ellipsis
                    href={`/${reply.comment?.user?.username || "story"}/${
                      reply.comment?.story?.slug
                    }/comments/${reply.comment_id}`}
                    title={reply.comment?.content}
                  >
                    {reply.comment?.content || "Empty comment"}
                  </Link>
                ) : (
                  <Link
                    ellipsis
                    fixedColor
                    href={`/${reply.user?.username || ""}`}
                    title={`View @${reply.user?.username}'s profile`}
                  >
                    {reply.user?.name}
                  </Link>
                )
              }
              secondaryText={
                <Typography
                  className={clsx("t-medium", "t-minor")}
                  ellipsis
                  level={"body3"}
                >
                  {isStatic && isSelf ? (
                    <Link href={`/${reply.comment?.user?.username}`}>
                      @{reply.comment?.user?.username}
                    </Link>
                  ) : (
                    <Link href={`/${reply.user?.username || ""}`}>
                      @{reply.user?.username}
                    </Link>
                  )}{" "}
                  &bull;{" "}
                  {formatDate(
                    reply.created_at,
                    DateFormat.RELATIVE_CAPITALIZED
                  )}
                  {reply.edited_at && ` (edited)`}
                </Typography>
              }
            />
            <Actions hidden={hidden} reply={reply} setHidden={setHiddenImpl} />
          </div>
          {hidden ? (
            <Typography
              className={clsx(
                "t-minor",
                styles.hidden,
                isStatic && styles.static
              )}
              level={"body2"}
            >
              This reply has been hidden at the request of the story author.{" "}
              <Link
                className={"t-medium"}
                fixedColor
                href={"#"}
                onClick={(): void => setHidden(false)}
                underline={"always"}
              >
                View reply
              </Link>
            </Typography>
          ) : (
            <React.Fragment>
              <div className={clsx(styles.content, isStatic && styles.static)}>
                <ResponseParser content={reply.rendered_content} />
              </div>
              <footer className={clsx("flex-center")}>
                {isStatic ? (
                  <React.Fragment>
                    <span className={clsx("flex-center", styles.stat)}>
                      <HeartIcon />{" "}
                      <Typography
                        className={clsx("t-medium", "t-minor")}
                        level={"body3"}
                      >
                        {abbreviateNumber(reply.like_count)}{" "}
                        {reply.like_count === 1 ? "like" : "likes"}
                      </Typography>
                    </span>
                    <Spacer className={"f-grow"} size={1.5} />
                    <IconButton
                      aria-label={"View reply"}
                      as={NextLink}
                      href={replyUrl}
                      size={"sm"}
                      title={"View reply"}
                      variant={"ghost"}
                    >
                      <ExternalLinkIcon />
                    </IconButton>
                  </React.Fragment>
                ) : (
                  <React.Fragment>
                    <Grow />
                    <Button
                      aria-label={`${
                        isLiked ? "Unlike" : "Like"
                      } reply (${abbreviateNumber(reply.like_count)} likes)`}
                      decorator={<HeartIcon noStroke={isLiked} />}
                      onClick={(): void => {
                        dispatch(setLikedReply([reply.id]));
                      }}
                      size={isMobile ? "md" : "sm"}
                      title={`${isLiked ? "Unlike" : "Like"} reply`}
                      variant={"ghost"}
                    >
                      {abbreviateNumber(reply.like_count)}
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

export default React.memo(Reply);
