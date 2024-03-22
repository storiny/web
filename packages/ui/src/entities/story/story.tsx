"use client";

import { ImageSize } from "@storiny/shared";
import { get_blog_url } from "@storiny/shared/src/utils/get-blog-url";
import { use_app_router } from "@storiny/web/src/common/utils";
import clsx from "clsx";
import NextLink from "next/link";
import React from "react";

import AspectRatio from "~/components/aspect-ratio";
import Button from "~/components/button";
import Chip from "~/components/chip";
import Grow from "~/components/grow";
import IconButton from "~/components/icon-button";
import Image from "~/components/image";
import Link from "~/components/link";
import NoSsr from "~/components/no-ssr";
import Spacer from "~/components/spacer";
import Tooltip from "~/components/tooltip";
import Typography from "~/components/typography";
import UserHoverCard from "~/components/user-hover-card";
import Persona from "~/entities/persona";
import TagChip from "~/entities/tag-chip";
import { use_media_query } from "~/hooks/use-media-query";
import BookmarkIcon from "~/icons/bookmark";
import BookmarkPlusIcon from "~/icons/bookmark-plus";
import ClockIcon from "~/icons/clock";
import CommentIcon from "~/icons/comment";
import HeartIcon from "~/icons/heart";
import ReadsIcon from "~/icons/reads";
import TrashIcon from "~/icons/trash";
import XIcon from "~/icons/x";
import { boolean_action } from "~/redux/features";
import { select_user } from "~/redux/features/auth/selectors";
import { sync_with_story } from "~/redux/features/entities/slice";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import { BREAKPOINTS } from "~/theme/breakpoints";
import css from "~/theme/main.module.scss";
import { abbreviate_number } from "~/utils/abbreviate-number";
import { DateFormat, format_date } from "~/utils/format-date";
import { get_cdn_url } from "~/utils/get-cdn-url";
import { get_read_time } from "~/utils/get-read-time";

import Actions, { RestoreAction } from "./actions";
import styles from "./story.module.scss";
import { StoryProps } from "./story.props";

/**
 * Returns the story URL
 * @param props Story props
 */
const get_story_url = (props: StoryProps): string => {
  const { story, is_deleted, is_contributable, is_draft, is_blog } = props;

  if (is_blog || is_draft || is_contributable || is_deleted) {
    return `/doc/${story.id}`;
  }

  if (story.blog) {
    return `${get_blog_url(story.blog)}/${story.slug ?? story.id}`;
  }

  return `/${story.user?.username || "story"}/${story.slug ?? story.id}`;
};

// Meta

const Meta = (props: StoryProps): React.ReactElement | null => {
  const { is_extended, is_deleted, is_draft, story } = props;
  const is_mobile = use_media_query(BREAKPOINTS.down("mobile"));

  return is_deleted ? (
    is_mobile ? (
      <Spacer orientation={"vertical"} size={0.5} />
    ) : (
      <NoSsr>
        <Typography
          as={"time"}
          className={clsx(css["flex"], styles["deleted-label"])}
          color={"minor"}
          dateTime={story.deleted_at!}
          level={"body2"}
          title={format_date(story.deleted_at!)}
          weight={"medium"}
        >
          <TrashIcon />
          <Spacer size={0.75} />
          <span>
            Deleted {format_date(story.deleted_at!, DateFormat.RELATIVE)}
          </span>
        </Typography>
      </NoSsr>
    )
  ) : is_extended && !is_draft ? (
    is_mobile ? (
      <Spacer orientation={"vertical"} size={0.5} />
    ) : (
      <NoSsr>
        <Typography
          as={"time"}
          color={"minor"}
          dateTime={story.published_at!}
          level={"body2"}
          title={format_date(story.published_at!)}
          weight={"medium"}
        >
          Published {format_date(story.published_at!, DateFormat.RELATIVE)}
        </Typography>
      </NoSsr>
    )
  ) : is_draft ? (
    is_mobile ? (
      <Spacer orientation={"vertical"} size={0.5} />
    ) : (
      <NoSsr>
        <Typography
          as={"time"}
          color={"minor"}
          dateTime={story.edited_at || story.created_at}
          level={"body2"}
          title={format_date(story.edited_at || story.created_at)}
          weight={"medium"}
        >
          Edited{" "}
          {format_date(
            story.edited_at || story.created_at,
            DateFormat.RELATIVE
          )}
        </Typography>
      </NoSsr>
    )
  ) : (
    <Persona
      avatar={{
        avatar_id: story.user?.avatar_id,
        hex: story.user?.avatar_hex,
        alt: "",
        className: css["focusable"],
        // @ts-expect-error polymorphic prop
        href: `/${story.user.username}`,
        title: `View ${story.user?.name}'s profile`,
        as: NextLink,
        label: story.user?.name || ""
      }}
      className={styles.persona}
      component_props={{
        primary_text: {
          className: css["full-w"]
        }
      }}
      primary_text={
        <span
          className={clsx(css.flex, css["full-w"])}
          style={{ gap: "4px", maxWidth: "calc(100% - 32px)" }}
        >
          <UserHoverCard identifier={story.user?.id || story.user_id}>
            <Link
              className={clsx(css["t-medium"], css.ellipsis)}
              fixed_color
              href={`/${story.user?.username}`}
              level={"body2"}
            >
              {story.user?.name}
            </Link>
          </UserHoverCard>
          {story.blog && (
            <React.Fragment>
              <Typography as={"span"} color={"minor"} level={"body2"}>
                in
              </Typography>
              <Link
                className={clsx(css["t-medium"], css.ellipsis)}
                fixed_color
                href={get_blog_url(story.blog)}
                level={"body2"}
              >
                {story.blog.name}
              </Link>
            </React.Fragment>
          )}
          <Typography aria-hidden as={"span"} color={"muted"} level={"body2"}>
            &bull;
          </Typography>
          <NoSsr>
            <Typography
              as={"time"}
              className={css.ellipsis}
              color={"minor"}
              dateTime={story.published_at || story.created_at}
              level={"body2"}
              title={format_date(story.published_at || story.created_at)}
            >
              {format_date(
                story.published_at || story.created_at,
                DateFormat.RELATIVE_CAPITALIZED
              )}
            </Typography>
          </NoSsr>
        </span>
      }
      size={"sm"}
    />
  );
};

// Splash

const Splash = (props: StoryProps): React.ReactElement => {
  const {
    is_extended,
    is_contributable,
    is_deleted,
    is_draft,
    is_large,
    show_unlike_button,
    story,
    custom_action
  } = props;
  const router = use_app_router();
  const dispatch = use_app_dispatch();
  const is_mobile = use_media_query(BREAKPOINTS.down("mobile"));
  const is_bookmarked = use_app_selector(
    (state) => state.entities.bookmarks[story.id]
  );
  const is_liked = use_app_selector(
    (state) => state.entities.liked_stories[story.id]
  );
  const story_url = get_story_url(props);
  const is_small = is_extended || is_contributable || is_deleted || is_draft;
  const show_interactive_buttons = Boolean(
    !is_extended && !is_contributable && !is_deleted && !is_draft
  );

  return (
    <AspectRatio
      aria-label={"Read this story"}
      as={is_mobile ? undefined : NextLink}
      className={clsx(
        styles.splash,
        is_small && styles.small,
        is_large && styles.large
      )}
      ratio={16 / 9}
      tabIndex={-1}
      // Use onClick to avoid nesting anchor inside another anchor
      {...(is_mobile
        ? {
            // eslint-disable-next-line prefer-snakecase/prefer-snakecase
            onClick: () => router.push(story_url)
          }
        : { href: story_url })}
    >
      <Image
        alt={""}
        hex={story.splash_hex}
        img_key={story.splash_id}
        slot_props={{
          image: {
            className: styles["splash-img"],
            loading: "lazy",
            sizes: ["(min-width: 650px) 320px", "100vw"].join(","),
            // eslint-disable-next-line prefer-snakecase/prefer-snakecase
            srcSet: [
              `${get_cdn_url(story.splash_id, ImageSize.W_320)} 320w`,
              `${get_cdn_url(story.splash_id, ImageSize.W_960)} 960w`
            ].join(",")
          }
        }}
      />
      {is_mobile && (
        <span className={clsx(css["flex"], styles["mobile-actions"])}>
          {!is_extended && !is_contributable ? (
            <React.Fragment>
              {show_interactive_buttons && show_unlike_button && is_liked ? (
                <IconButton
                  aria-label={"Unlike this story"}
                  check_auth
                  className={"force-light-mode"}
                  onClick={(event): void => {
                    event.stopPropagation();
                    dispatch(boolean_action("liked_stories", story.id, false));
                  }}
                  size={"lg"}
                >
                  <XIcon />
                </IconButton>
              ) : null}
              {show_interactive_buttons && (
                <IconButton
                  aria-label={`${
                    is_bookmarked ? "Un-bookmark" : "Bookmark"
                  } this story`}
                  check_auth
                  className={"force-light-mode"}
                  onClick={(event): void => {
                    event.stopPropagation();
                    dispatch(boolean_action("bookmarks", story.id));
                  }}
                  size={"lg"}
                >
                  {is_bookmarked ? (
                    <BookmarkIcon no_stroke />
                  ) : (
                    <BookmarkPlusIcon />
                  )}
                </IconButton>
              )}
            </React.Fragment>
          ) : null}
          {is_deleted ? (
            <RestoreAction is_draft={is_draft} overlay story={story} />
          ) : (
            <Actions
              custom_action={custom_action}
              is_contributable={is_contributable}
              is_draft={is_draft}
              is_extended={is_extended}
              overlay
              story={story}
            />
          )}
        </span>
      )}
    </AspectRatio>
  );
};

// Footer

const Footer = (props: StoryProps): React.ReactElement => {
  const {
    is_extended,
    is_contributable,
    is_deleted,
    is_draft,
    story,
    show_unlike_button,
    custom_action
  } = props;
  const is_mobile = use_media_query(BREAKPOINTS.down("mobile"));
  const dispatch = use_app_dispatch();
  const user = use_app_selector(select_user);
  const is_bookmarked = use_app_selector(
    (state) => state.entities.bookmarks[story.id]
  );
  const is_liked = use_app_selector(
    (state) => state.entities.liked_stories[story.id]
  );
  const show_word_count = is_draft || is_deleted;
  const show_tags = Boolean(!is_draft && !is_deleted);
  const show_interactive_buttons = Boolean(
    !is_extended && !is_contributable && !is_deleted && !is_draft
  );

  return (
    <footer className={clsx(css["flex"], styles.footer)}>
      {show_word_count ? (
        <Typography
          as={"span"}
          className={clsx(css["flex-center"], styles.stat)}
          color={"minor"}
          level={"body2"}
          title={story.word_count.toLocaleString()}
          weight={"medium"}
        >
          {abbreviate_number(story.word_count)} words
          {is_mobile && (
            <React.Fragment>
              <Typography
                aria-hidden
                as={"span"}
                color={"muted"}
                level={"body2"}
              >
                &bull;
              </Typography>
              {is_deleted ? (
                <NoSsr>
                  <Typography
                    as={"time"}
                    color={"minor"}
                    dateTime={story.deleted_at!}
                    level={"body2"}
                    title={format_date(story.deleted_at!)}
                    weight={"medium"}
                  >
                    Deleted{" "}
                    {format_date(story.deleted_at!, DateFormat.RELATIVE)}
                  </Typography>
                </NoSsr>
              ) : (
                <NoSsr>
                  <Typography
                    as={"time"}
                    color={"minor"}
                    dateTime={story.edited_at || story.created_at}
                    level={"body2"}
                    title={format_date(story.edited_at || story.created_at)}
                    weight={"medium"}
                  >
                    Edited{" "}
                    {format_date(
                      story.edited_at || story.created_at,
                      DateFormat.RELATIVE
                    )}
                  </Typography>
                </NoSsr>
              )}
            </React.Fragment>
          )}
        </Typography>
      ) : (
        <React.Fragment>
          {!is_extended && !is_contributable ? (
            <React.Fragment>
              <Typography
                aria-label={`${get_read_time(
                  story.word_count,
                  user?.wpm
                )} min read`}
                as={"span"}
                className={clsx(css["flex-center"], styles.stat)}
                color={"minor"}
                level={"body2"}
                title={`${get_read_time(story.word_count, user?.wpm)} min read`}
                weight={"medium"}
              >
                <ClockIcon />
                {get_read_time(story.word_count, user?.wpm)} min
              </Typography>
              <Typography
                aria-hidden
                as={"span"}
                color={"muted"}
                level={"body2"}
              >
                &bull;
              </Typography>
            </React.Fragment>
          ) : null}
          <Typography
            aria-label={`${story.read_count} reads`}
            as={"span"}
            className={clsx(css["flex-center"], styles.stat)}
            color={"minor"}
            level={"body2"}
            title={`${abbreviate_number(story.read_count)} reads`}
            weight={"medium"}
          >
            <ReadsIcon />
            {abbreviate_number(story.read_count)}
          </Typography>
          {is_extended && (
            <React.Fragment>
              {story.like_count ? (
                <React.Fragment>
                  <Typography
                    aria-hidden
                    as={"span"}
                    color={"muted"}
                    level={"body2"}
                  >
                    &bull;
                  </Typography>
                  <Typography
                    aria-label={`${story.like_count} likes`}
                    as={"span"}
                    className={clsx(css["flex-center"], styles.stat)}
                    color={"minor"}
                    level={"body2"}
                    title={`${abbreviate_number(story.like_count)} likes`}
                    weight={"medium"}
                  >
                    <HeartIcon />
                    {abbreviate_number(story.like_count)}
                  </Typography>
                </React.Fragment>
              ) : null}
              {story.comment_count ? (
                <React.Fragment>
                  <Typography
                    aria-hidden
                    as={"span"}
                    color={"muted"}
                    level={"body2"}
                  >
                    &bull;
                  </Typography>
                  <Typography
                    aria-label={`${story.comment_count} comments`}
                    as={"span"}
                    className={clsx(css["flex-center"], styles.stat)}
                    color={"minor"}
                    level={"body2"}
                    title={`${abbreviate_number(story.comment_count)} comments`}
                    weight={"medium"}
                  >
                    <CommentIcon />
                    {abbreviate_number(story.comment_count)}
                  </Typography>
                </React.Fragment>
              ) : null}
            </React.Fragment>
          )}
        </React.Fragment>
      )}
      {show_tags && (story.tags || []).length ? (
        <>
          {is_mobile ? (
            <Grow />
          ) : (
            <Typography aria-hidden as={"span"} color={"muted"} level={"body2"}>
              &bull;
            </Typography>
          )}
          <div className={clsx(css["flex"], styles["tags-container"])}>
            {story.tags.slice(0, is_mobile ? 1 : 2).map((tag) => (
              <TagChip
                key={tag.id}
                size={is_mobile ? "lg" : "md"}
                value={tag.name}
              />
            ))}
            {story.tags.length > (is_mobile ? 1 : 2) && (
              <Chip variant={"soft"}>
                +{story.tags.length - (is_mobile ? 1 : 2)}
              </Chip>
            )}
          </div>
        </>
      ) : null}
      {!is_mobile && (
        <>
          <Grow />
          <div className={clsx(css["flex"])}>
            {show_interactive_buttons && (
              <React.Fragment>
                {show_unlike_button && is_liked ? (
                  <Tooltip content={"Unlike this story"}>
                    <IconButton
                      aria-label={"Unlike this story"}
                      check_auth
                      onClick={(): void => {
                        dispatch(
                          boolean_action("liked_stories", story.id, false)
                        );
                      }}
                      variant={"ghost"}
                    >
                      <XIcon />
                    </IconButton>
                  </Tooltip>
                ) : null}
                <Tooltip
                  content={`${
                    is_bookmarked ? "Un-bookmark" : "Bookmark"
                  } this story`}
                >
                  <IconButton
                    aria-label={`${
                      is_bookmarked ? "Un-bookmark" : "Bookmark"
                    } this story`}
                    auto_size
                    check_auth
                    onClick={(): void => {
                      dispatch(boolean_action("bookmarks", story.id));
                    }}
                    variant={"ghost"}
                  >
                    {is_bookmarked ? (
                      <BookmarkIcon no_stroke />
                    ) : (
                      <BookmarkPlusIcon />
                    )}
                  </IconButton>
                </Tooltip>
              </React.Fragment>
            )}
            {is_deleted ? (
              <RestoreAction is_draft={is_draft} overlay story={story} />
            ) : (
              <Actions
                custom_action={custom_action}
                is_contributable={is_contributable}
                is_draft={is_draft}
                is_extended={is_extended}
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
    className,
    story,
    is_large,
    is_extended,
    is_deleted,
    is_draft: is_draft_prop,
    is_blog,
    is_contributable,
    enable_ssr,
    virtual,
    custom_action,
    ...rest
  } = props;
  const is_draft = is_draft_prop ?? story.published_at === null;
  const dispatch = use_app_dispatch();
  const is_user_blocked = use_app_selector(
    (state) => state.entities.blocks[story.user_id]
  );
  const [collapsed, set_collapsed] = React.useState(is_user_blocked);
  const is_mobile = use_media_query(BREAKPOINTS.down("mobile"));
  const story_url = get_story_url({ ...props, is_draft });
  const is_small = is_extended || is_contributable || is_deleted || is_draft;

  React.useEffect(() => {
    dispatch(sync_with_story(story));
  }, [dispatch, story]);

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
            styles.story,
            virtual && styles.virtual
          )}
        >
          {/* `span` act as block-spacers using the `gap` property */}
          <span aria-hidden />
          <Typography level={"body2"}>
            You have blocked the writer of this story.
          </Typography>
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
            styles.story,
            virtual && styles.virtual,
            className
          )}
        >
          <div
            className={clsx(css["flex"], styles.main, is_large && styles.large)}
          >
            <div className={clsx(css["flex-col"], styles.meta)}>
              <div className={css.flex}>
                <Typography
                  as={NextLink}
                  className={clsx(
                    css["focusable"],
                    styles.title,
                    is_small && styles.small
                  )}
                  href={story_url}
                  level={"h2"}
                >
                  {story.title}
                </Typography>
                {is_mobile && !story.splash_id ? (
                  <>
                    <Spacer className={css["f-grow"]} size={1.5} />
                    {is_deleted ? (
                      <RestoreAction is_draft={is_draft} story={story} />
                    ) : (
                      <Actions
                        custom_action={custom_action}
                        is_contributable={is_contributable}
                        is_draft={is_draft}
                        is_extended={is_extended}
                        story={story}
                      />
                    )}
                  </>
                ) : null}
              </div>
              <Meta {...props} is_draft={is_draft} />
              <Typography
                as={NextLink}
                className={styles.description}
                color={"minor"}
                href={story_url}
                level={"body2"}
                tabIndex={-1}
              >
                {story.description}
              </Typography>
            </div>
            {story.splash_id && <Splash {...props} />}
          </div>
          <Footer {...props} is_draft={is_draft} />
        </article>
      )}
    </NoSsr>
  );
};

export default React.memo(Story);
