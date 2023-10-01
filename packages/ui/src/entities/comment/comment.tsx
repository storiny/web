"use client";

import { ImageSize } from "@storiny/shared";
import clsx from "clsx";
import dynamic from "next/dynamic";
import NextLink from "next/link";
import React from "react";

import AspectRatio from "~/components/aspect-ratio";
import Button from "~/components/button";
import IconButton from "~/components/icon-button";
import Image from "~/components/image";
import Link from "~/components/link";
import NoSsr from "~/components/no-ssr";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import Persona from "~/entities/persona";
import { use_media_query } from "~/hooks/use-media-query";
import ExternalLinkIcon from "~/icons/external-link";
import HeartIcon from "~/icons/heart";
import ReplyIcon from "~/icons/reply";
import { boolean_action, select_is_logged_in } from "~/redux/features";
import { sync_with_comment } from "~/redux/features/entities/slice";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import { BREAKPOINTS } from "~/theme/breakpoints";
import css from "~/theme/main.module.scss";
import { abbreviate_number } from "~/utils/abbreviate-number";
import { DateFormat, format_date } from "~/utils/format-date";

import ResponseParser from "../common/response-parser";
import Actions from "./actions";
import styles from "./comment.module.scss";
import { CommentProps } from "./comment.props";

const AuxiliaryContent = dynamic(() => import("./auxiliary-content"));

const StoryPersona = (props: {
  created_at: string;
  edited_at: string | null;
  story: NonNullable<CommentProps["comment"]["story"]>;
}): React.ReactElement => {
  const { story, created_at, edited_at } = props;
  return (
    <div className={clsx(css["flex"], styles["story-persona"])}>
      {story.splash_id && (
        <AspectRatio className={styles["story-splash"]} ratio={1.77}>
          <Image
            alt={""}
            hex={story.splash_hex}
            img_key={story.splash_id}
            size={ImageSize.W_64}
          />
        </AspectRatio>
      )}
      <div className={css["flex-col"]}>
        <Link
          className={css["t-medium"]}
          ellipsis
          fixed_color
          href={`/${story.user?.username || "story"}/${story.slug}`}
          level={"body2"}
        >
          {story.title}
        </Link>
        <Typography
          className={clsx(css["t-minor"], css["t-medium"])}
          ellipsis
          level={"body3"}
        >
          {format_date(created_at, DateFormat.RELATIVE_CAPITALIZED)}
          {edited_at && ` (edited)`}
        </Typography>
      </div>
    </div>
  );
};

const Comment = (props: CommentProps): React.ReactElement => {
  const {
    hide_hidden_overlay,
    is_static,
    is_extended,
    className,
    comment,
    enable_ssr,
    virtual,
    ...rest
  } = props;
  const dispatch = use_app_dispatch();
  const is_mobile = use_media_query(BREAKPOINTS.down("mobile"));
  const logged_in = use_app_selector(select_is_logged_in);
  const is_user_blocked = use_app_selector(
    (state) => state.entities.blocks[comment.user_id]
  );
  const is_liked = use_app_selector(
    (state) => state.entities.liked_comments[comment.id]
  );
  const like_count =
    use_app_selector(
      (state) => state.entities.comment_like_counts[comment.id]
    ) || 0;
  const reply_count =
    use_app_selector(
      (state) => state.entities.comment_reply_counts[comment.id]
    ) || 0;
  const [hidden, set_hidden] = React.useState(Boolean(comment.hidden));
  const [collapsed, set_collapsed] = React.useState(is_user_blocked);
  const [show_reply_list, set_show_reply_list] = React.useState<boolean>(false);
  const comment_url = `/${comment.story?.user?.username || "story"}/${
    comment.story?.slug || comment.story_id
  }/comments/${comment.id}`;

  /**
   * Mutates the comment's visibility
   */
  const set_hidden_impl = React.useCallback(set_hidden, [set_hidden]);

  React.useEffect(() => {
    dispatch(sync_with_comment(comment));
  }, [dispatch, comment]);

  // Collapse on block
  React.useEffect(() => {
    set_collapsed(is_user_blocked);
  }, [is_user_blocked]);

  return (
    <NoSsr disabled={enable_ssr}>
      {collapsed ? (
        <div
          className={clsx(
            css["flex-col"],
            css["flex-center"],
            styles.comment,
            virtual && styles.virtual
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
            css["flex-col"],
            styles.comment,
            virtual && styles.virtual,
            className
          )}
        >
          <div className={clsx(css["flex"], styles.header)}>
            {is_extended ? (
              <StoryPersona
                created_at={comment.created_at}
                edited_at={comment.edited_at}
                story={comment.story!}
              />
            ) : (
              <Persona
                avatar={{
                  alt: `${comment.user?.name}'s avatar`,
                  avatar_id: comment.user?.avatar_id,
                  label: comment.user?.name,
                  hex: comment.user?.avatar_hex
                }}
                primary_text={
                  <Link
                    ellipsis
                    fixed_color
                    href={`/${comment.user?.username || ""}`}
                  >
                    {comment.user?.name}
                  </Link>
                }
                secondary_text={
                  <Typography
                    className={clsx(css["t-medium"], css["t-minor"])}
                    ellipsis
                    level={"body3"}
                  >
                    <Link href={`/${comment.user?.username || ""}`}>
                      @{comment.user?.username}
                    </Link>{" "}
                    &bull;{" "}
                    {format_date(
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
              set_hidden={set_hidden_impl}
            />
          </div>
          {hidden && !hide_hidden_overlay ? (
            <Typography
              className={clsx(css["t-minor"], styles.hidden)}
              level={"body2"}
            >
              This comment has been hidden at the request of the story author.{" "}
              <Link
                className={css["t-medium"]}
                fixed_color
                href={"#"}
                onClick={(): void => set_hidden(false)}
                underline={"always"}
              >
                View comment
              </Link>
            </Typography>
          ) : (
            <React.Fragment>
              <div className={styles.content}>
                <ResponseParser content={comment.rendered_content} />
              </div>
              <footer className={css["flex-center"]}>
                {is_static || is_extended ? (
                  <React.Fragment>
                    <span className={clsx(css["flex-center"], styles.stat)}>
                      <HeartIcon />{" "}
                      <Typography
                        className={clsx(css["t-medium"], css["t-minor"])}
                        level={"body3"}
                      >
                        {abbreviate_number(like_count)}{" "}
                        {like_count === 1 ? "like" : "likes"}
                      </Typography>
                    </span>
                    <Spacer size={1.5} />
                    <span className={clsx(css["flex-center"], styles.stat)}>
                      <ReplyIcon />{" "}
                      <Typography
                        className={clsx(css["t-medium"], css["t-minor"])}
                        level={"body3"}
                      >
                        {abbreviate_number(reply_count)}{" "}
                        {reply_count === 1 ? "reply" : "replies"}
                      </Typography>
                    </span>
                    <Spacer className={css["f-grow"]} size={1.5} />
                    <IconButton
                      aria-label={"View comment"}
                      as={NextLink}
                      href={comment_url}
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
                        is_liked ? "Unlike" : "Like"
                      } comment (${abbreviate_number(like_count)} likes)`}
                      check_auth
                      decorator={<HeartIcon no_stroke={is_liked} />}
                      onClick={(): void => {
                        dispatch(boolean_action("liked_comments", comment.id));
                      }}
                      size={is_mobile ? "md" : "sm"}
                      title={`${is_liked ? "Unlike" : "Like"} comment`}
                      variant={"ghost"}
                    >
                      {abbreviate_number(like_count)}
                    </Button>
                    <Button
                      aria-label={`${abbreviate_number(reply_count)} replies`}
                      check_auth={!logged_in && reply_count === 0}
                      decorator={<ReplyIcon />}
                      onClick={(): void =>
                        set_show_reply_list((prev_state) => !prev_state)
                      }
                      size={is_mobile ? "md" : "sm"}
                      variant={"ghost"}
                    >
                      {abbreviate_number(reply_count)}
                    </Button>
                    <Spacer className={css["f-grow"]} size={1.5} />
                    <Button
                      check_auth={!logged_in && reply_count === 0}
                      onClick={(): void =>
                        set_show_reply_list((prev_state) => !prev_state)
                      }
                      size={is_mobile ? "md" : "sm"}
                      variant={"ghost"}
                    >
                      Reply
                    </Button>
                  </React.Fragment>
                )}
              </footer>
              {!is_static && !is_extended && show_reply_list ? (
                <AuxiliaryContent
                  comment_id={comment.id}
                  placeholder={`Replying to @${comment.user?.username || ""}`}
                />
              ) : null}
            </React.Fragment>
          )}
        </article>
      )}
    </NoSsr>
  );
};

export default React.memo(Comment);
