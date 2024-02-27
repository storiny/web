import { get_blog_url } from "@storiny/shared/src/utils/get-blog-url";
import { use_blog_context } from "@storiny/web/src/app/blog/[slug]/context";
import { clsx } from "clsx";
import { useAtom as use_atom, useAtomValue as use_atom_value } from "jotai";
import React from "react";

import Button from "~/components/button";
import IconButton from "~/components/icon-button";
import Link from "~/components/link";
import Menu from "~/components/menu";
import MenuItem from "~/components/menu-item";
import NoSsr from "~/components/no-ssr";
import Separator from "~/components/separator";
import Spacer from "~/components/spacer";
import { use_toast } from "~/components/toast";
import Typography from "~/components/typography";
import Persona from "~/entities/persona";
import ReportModal from "~/entities/report-modal";
import { use_clipboard } from "~/hooks/use-clipboard";
import { use_media_query } from "~/hooks/use-media-query";
import { use_web_share } from "~/hooks/use-web-share";
import BookmarkIcon from "~/icons/bookmark";
import BookmarkPlusIcon from "~/icons/bookmark-plus";
import CalendarIcon from "~/icons/calendar";
import ClockIcon from "~/icons/clock";
import CopyIcon from "~/icons/copy";
import DotsIcon from "~/icons/dots";
import MuteIcon from "~/icons/mute";
import ReportIcon from "~/icons/report";
import ShareIcon from "~/icons/share";
import SidebarCollapseIcon from "~/icons/sidebar-collapse";
import SidebarExpandIcon from "~/icons/sidebar-expand";
import UserCheckIcon from "~/icons/user-check";
import UserPlusIcon from "~/icons/user-plus";
import { boolean_action, select_user } from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import { BREAKPOINTS } from "~/theme/breakpoints";
import css from "~/theme/main.module.scss";
import { abbreviate_number } from "~/utils/abbreviate-number";
import { DateFormat, format_date } from "~/utils/format-date";
import { get_read_time } from "~/utils/get-read-time";

import { sidebars_collapsed_atom, story_metadata_atom } from "../../atoms";
import styles from "./story-header.module.scss";

// Actions

const StoryActions = (): React.ReactElement => {
  const is_larger_than_desktop = use_media_query(BREAKPOINTS.up("desktop"));
  const toast = use_toast();
  const story = use_atom_value(story_metadata_atom);
  const user = use_app_selector(select_user);
  const [sidebars_collapsed, set_sidebars_collapsed] = use_atom(
    sidebars_collapsed_atom
  );
  const share = use_web_share(toast);
  const copy = use_clipboard();
  const dispatch = use_app_dispatch();
  const is_bookmarked = use_app_selector(
    (state) => state.entities.bookmarks[story.id]
  );
  const is_muted = use_app_selector(
    (state) => state.entities.mutes[story.user?.id || ""]
  );
  const is_self = story.user_id === user?.id;
  const blog = use_blog_context();
  const story_url = blog
    ? `${get_blog_url(blog)}/${story.slug}`
    : `${process.env.NEXT_PUBLIC_WEB_URL}/${story.user?.username || "story"}/${
        story.slug
      }`;

  return (
    <div className={css["flex-center"]}>
      {!blog && (
        <IconButton
          aria-label={`${is_bookmarked ? "Un-bookmark" : "Bbookmark"} story`}
          auto_size
          check_auth
          onClick={(): void => {
            dispatch(boolean_action("bookmarks", story.id));
          }}
          title={`${is_bookmarked ? "Un-bookmark" : "Bbookmark"} story`}
          variant={"ghost"}
        >
          {is_bookmarked ? <BookmarkIcon no_stroke /> : <BookmarkPlusIcon />}
        </IconButton>
      )}
      <Menu
        trigger={
          <IconButton
            aria-label={"Story options"}
            auto_size
            title={"Story options"}
            variant={"ghost"}
          >
            <DotsIcon />
          </IconButton>
        }
      >
        <MenuItem
          decorator={<ShareIcon />}
          onClick={(): void => share(story.title, story_url)}
        >
          Share
        </MenuItem>
        <MenuItem
          decorator={<CopyIcon />}
          onClick={(): void => copy(story_url)}
        >
          Copy link to story
        </MenuItem>
        {is_larger_than_desktop && !blog ? (
          <React.Fragment>
            <Separator />
            <MenuItem
              decorator={
                sidebars_collapsed ? (
                  <SidebarExpandIcon />
                ) : (
                  <SidebarCollapseIcon />
                )
              }
              onClick={(): void => set_sidebars_collapsed((prev) => !prev)}
            >
              {sidebars_collapsed ? "Expand" : "Collapse"} sidebars
            </MenuItem>
          </React.Fragment>
        ) : null}
        {!is_self && (
          <>
            <Separator />
            <MenuItem
              check_auth
              decorator={<MuteIcon />}
              onClick={(): void => {
                dispatch(boolean_action("mutes", story.user?.id || ""));
              }}
            >
              {is_muted ? "Unmute" : "Mute"} this writer
            </MenuItem>
            <ReportModal
              entity_id={story.id}
              entity_type={"story"}
              trigger={({ open_modal }): React.ReactElement => (
                <MenuItem
                  decorator={<ReportIcon />}
                  onClick={open_modal}
                  onSelect={(event): void => event.preventDefault()}
                >
                  Report this story
                </MenuItem>
              )}
            />
          </>
        )}
      </Menu>
    </div>
  );
};

// Sub-header

const Subheader = (): React.ReactElement | null => {
  const dispatch = use_app_dispatch();
  const is_mobile = use_media_query(BREAKPOINTS.down("mobile"));
  const story = use_atom_value(story_metadata_atom);
  const current_user = use_app_selector(select_user);
  const user = story.user;
  const follower_count =
    use_app_selector(
      (state) => state.entities.follower_counts[user?.id || ""]
    ) || 0;
  const is_following = use_app_selector(
    (state) => state.entities.following[user?.id || ""]
  );
  const is_self = current_user?.id === user?.id;

  if (!user) {
    return null;
  }

  return (
    <div className={css["flex-center"]}>
      <Persona
        avatar={{
          alt: `${user?.name}'s avatar`,
          avatar_id: user?.avatar_id,
          label: user?.name,
          hex: user?.avatar_hex
        }}
        component_props={{
          secondary_text: {
            ellipsis: true
          }
        }}
        primary_text={
          <Link ellipsis fixed_color href={`/${user.username}`}>
            {user.name}
          </Link>
        }
        secondary_text={
          <>
            @{user.username} &bull; {abbreviate_number(follower_count)}{" "}
            {follower_count === 1 ? "follower" : "followers"}
          </>
        }
        size={"lg"}
      />
      <Spacer className={css["f-grow"]} size={2} />
      {is_self ? null : is_mobile ? (
        <IconButton
          auto_size
          check_auth
          onClick={(): void => {
            dispatch(boolean_action("following", user.id));
          }}
          variant={is_following ? "hollow" : "rigid"}
        >
          {is_following ? <UserCheckIcon /> : <UserPlusIcon />}
        </IconButton>
      ) : (
        <Button
          auto_size
          check_auth
          decorator={is_following ? <UserCheckIcon /> : <UserPlusIcon />}
          onClick={(): void => {
            dispatch(boolean_action("following", user.id));
          }}
          variant={is_following ? "hollow" : "rigid"}
        >
          {is_following ? "Following" : "Follow"}
        </Button>
      )}
    </div>
  );
};

const StoryHeader = (): React.ReactElement => {
  const is_mobile = use_media_query(BREAKPOINTS.down("mobile"));
  const is_smaller_than_desktop = use_media_query(BREAKPOINTS.down("desktop"));
  const sidebars_collapsed = use_atom_value(sidebars_collapsed_atom);
  const story = use_atom_value(story_metadata_atom);
  const user = use_app_selector(select_user);

  return (
    <header>
      <Typography level={"h1"}>{story.title}</Typography>
      {is_smaller_than_desktop || sidebars_collapsed ? (
        <React.Fragment>
          <Spacer orientation={"vertical"} size={sidebars_collapsed ? 4 : 2} />
          <Subheader />
        </React.Fragment>
      ) : null}
      <Spacer orientation={"vertical"} size={2} />
      <div className={clsx(css["flex-center"], styles.metadata)}>
        <NoSsr>
          <Typography
            as={"time"}
            className={clsx(css["flex-center"], styles.x, styles.stat)}
            color={"minor"}
            dateTime={story.published_at!}
            level={"body2"}
            title={format_date(story.published_at!, DateFormat.LONG)}
          >
            <CalendarIcon />
            <span>
              {format_date(
                story.published_at!,
                is_mobile ? DateFormat.SHORT : DateFormat.STANDARD
              )}
            </span>
          </Typography>
        </NoSsr>
        <Typography
          aria-label={`${get_read_time(story.word_count, user?.wpm)} min read`}
          className={clsx(css["flex-center"], styles.x, styles.stat)}
          color={"minor"}
          level={"body2"}
          title={`${get_read_time(story.word_count, user?.wpm)} min read`}
        >
          <ClockIcon />
          {get_read_time(story.word_count, user?.wpm)} min
        </Typography>
        <Spacer className={css["f-grow"]} />
        {Boolean(story.published_at) && <StoryActions />}
      </div>
      <Spacer orientation={"vertical"} size={5} />
    </header>
  );
};

export default StoryHeader;
