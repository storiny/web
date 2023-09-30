"use client";

import clsx from "clsx";
import NextLink from "next/link";
import React from "react";

import Button from "~/components/button";
import Grow from "~/components/grow";
import IconButton from "~/components/icon-button";
import Link from "~/components/link";
import NoSsr from "~/components/no-ssr";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import Persona from "~/entities/persona";
import { use_media_query } from "~/hooks/use-media-query";
import ExternalLinkIcon from "~/icons/external-link";
import HeartIcon from "~/icons/heart";
import ReplyIcon from "~/icons/reply";
import { boolean_action, select_user } from "~/redux/features";
import { sync_with_reply } from "~/redux/features/entities/slice";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import { BREAKPOINTS } from "~/theme/breakpoints";
import { abbreviate_number } from "~/utils/abbreviate-number";
import { DateFormat, format_date } from "~/utils/format-date";

import ResponseParser from "../common/response-parser";
import Actions from "./actions";
import styles from "./reply.module.scss";
import { ReplyProps } from "./reply.props";

const Reply = (props: ReplyProps): React.ReactElement => {
  const { is_static, className, reply, enable_ssr, virtual, nested, ...rest } =
    props;
  const dispatch = use_app_dispatch();
  const is_mobile = use_media_query(BREAKPOINTS.down("mobile"));
  const user = use_app_selector(select_user);
  const is_user_blocked = use_app_selector(
    (state) => state.entities.blocks[reply.user_id]
  );
  const is_liked = use_app_selector(
    (state) => state.entities.liked_replies[reply.id]
  );
  const like_count =
    use_app_selector((state) => state.entities.reply_like_counts[reply.id]) ||
    0;
  const is_self = user?.id === reply.user_id;
  const [hidden, set_hidden] = React.useState(Boolean(reply.hidden));
  const [collapsed, set_collapsed] = React.useState(is_user_blocked);
  const reply_url = `/${reply.comment?.story?.user?.username || "story"}/${
    reply.comment?.story?.slug || reply.comment?.story_id
  }/comments/${reply.comment?.id}?reply=${reply.id}`;

  /**
   * Mutates the reply's visibility
   */
  const set_hidden_impl = React.useCallback(set_hidden, [set_hidden]);

  React.useEffect(() => {
    dispatch(sync_with_reply(reply));
  }, [dispatch, reply]);

  // Collapse on block
  React.useEffect(() => {
    set_collapsed(is_user_blocked);
  }, [is_user_blocked]);

  return (
    <NoSsr disabled={enable_ssr}>
      {collapsed ? (
        <div
          className={clsx(
            "flex-col",
            "flex-center",
            styles.reply,
            styles.collapsed,
            virtual && styles.virtual,
            is_static && is_self && styles.static,
            nested && styles.nested
          )}
        >
          {/* `span` act as block-spacers using the `gap` property */}
          <span aria-hidden />
          <Typography level={"body2"}>You have blocked this user.</Typography>
          <Button onClick={(): void => set_collapsed(false)} variant={"hollow"}>
            View
          </Button>
          <span aria-hidden />
        </div>
      ) : (
        <article
          {...rest}
          className={clsx(
            "flex-col",
            styles.reply,
            virtual && styles.virtual,
            is_static && is_self && styles.static,
            nested && styles.nested,
            className
          )}
        >
          <div className={clsx("flex", styles.header)}>
            <Persona
              avatar={
                is_static && is_self
                  ? {
                      children: <ReplyIcon />,
                      className: styles.avatar,
                      slot_props: {
                        fallback: {
                          className: styles.fallback
                        }
                      }
                    }
                  : {
                      alt: `${reply.user?.name}'s avatar`,
                      avatar_id: reply.user?.avatar_id,
                      label: reply.user?.name,
                      hex: reply.user?.avatar_hex
                    }
              }
              primary_text={
                is_static && is_self ? (
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
                    fixed_color
                    href={`/${reply.user?.username || ""}`}
                    title={`View @${reply.user?.username}'s profile`}
                  >
                    {reply.user?.name}
                  </Link>
                )
              }
              secondary_text={
                <Typography
                  className={clsx("t-medium", "t-minor")}
                  ellipsis
                  level={"body3"}
                >
                  {is_static && is_self ? (
                    <Link href={`/${reply.comment?.user?.username}`}>
                      @{reply.comment?.user?.username}
                    </Link>
                  ) : (
                    <Link href={`/${reply.user?.username || ""}`}>
                      @{reply.user?.username}
                    </Link>
                  )}{" "}
                  &bull;{" "}
                  {format_date(
                    reply.created_at,
                    DateFormat.RELATIVE_CAPITALIZED
                  )}
                  {reply.edited_at && ` (edited)`}
                </Typography>
              }
            />
            <Actions
              hidden={hidden}
              reply={reply}
              set_hidden={set_hidden_impl}
            />
          </div>
          {hidden ? (
            <Typography
              className={clsx(
                "t-minor",
                styles.hidden,
                is_static && styles.static
              )}
              level={"body2"}
            >
              This reply has been hidden at the request of the story author.{" "}
              <Link
                className={"t-medium"}
                fixed_color
                href={"#"}
                onClick={(): void => set_hidden(false)}
                underline={"always"}
              >
                View reply
              </Link>
            </Typography>
          ) : (
            <React.Fragment>
              <div className={clsx(styles.content, is_static && styles.static)}>
                <ResponseParser content={reply.rendered_content} />
              </div>
              <footer className={clsx("flex-center")}>
                {is_static ? (
                  <React.Fragment>
                    <span className={clsx("flex-center", styles.stat)}>
                      <HeartIcon />{" "}
                      <Typography
                        className={clsx("t-medium", "t-minor")}
                        level={"body3"}
                      >
                        {abbreviate_number(like_count)}{" "}
                        {like_count === 1 ? "like" : "likes"}
                      </Typography>
                    </span>
                    <Spacer className={"f-grow"} size={1.5} />
                    <IconButton
                      aria-label={"View reply"}
                      as={NextLink}
                      href={reply_url}
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
                        is_liked ? "Unlike" : "Like"
                      } reply (${abbreviate_number(like_count)} likes)`}
                      check_auth
                      decorator={<HeartIcon no_stroke={is_liked} />}
                      onClick={(): void => {
                        dispatch(boolean_action("liked_replies", reply.id));
                      }}
                      size={is_mobile ? "md" : "sm"}
                      title={`${is_liked ? "Unlike" : "Like"} reply`}
                      variant={"ghost"}
                    >
                      {abbreviate_number(like_count)}
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
