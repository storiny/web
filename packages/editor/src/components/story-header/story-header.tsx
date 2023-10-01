import { clsx } from "clsx";
import { useAtom as use_atom, useAtomValue as use_atom_value } from "jotai";
import NextLink from "next/link";
import React from "react";

import Button from "~/components/button";
import IconButton from "~/components/icon-button";
import Link from "~/components/link";
import Menu from "~/components/menu";
import MenuItem from "~/components/menu-item";
import Separator from "~/components/separator";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import Persona from "~/entities/persona";
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
  const story = use_atom_value(story_metadata_atom);
  const [sidebars_collapsed, set_sidebars_collapsed] = use_atom(
    sidebars_collapsed_atom
  );
  const share = use_web_share();
  const copy = use_clipboard();
  const dispatch = use_app_dispatch();
  const is_bookmarked = use_app_selector(
    (state) => state.entities.bookmarks[story.id]
  );
  const is_muted = use_app_selector(
    (state) => state.entities.mutes[story.user!.id]
  );

  return (
    <div className={css["flex-center"]}>
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
          onClick={(): void =>
            share(
              story.title,
              `${process.env.NEXT_PUBLIC_WEB_URL}/${
                story.user?.username || "story"
              }/${story.slug}`
            )
          }
        >
          Share
        </MenuItem>
        <MenuItem
          decorator={<CopyIcon />}
          onClick={(): void =>
            copy(
              `${process.env.NEXT_PUBLIC_WEB_URL}/${
                story.user?.username || "story"
              }/${story.slug}`
            )
          }
        >
          Copy link to story
        </MenuItem>
        {is_larger_than_desktop && (
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
        )}
        <Separator />
        <MenuItem
          check_auth
          decorator={<MuteIcon />}
          onClick={(): void => {
            dispatch(boolean_action("mutes", story.user!.id));
          }}
        >
          {is_muted ? "Unmute" : "Mute"} this writer
        </MenuItem>
        <MenuItem
          as={NextLink}
          decorator={<ReportIcon />}
          href={`/report?id=${story.id}&type=story`}
          rel={"noreferrer"}
          target={"_blank"}
        >
          Report
        </MenuItem>
      </Menu>
    </div>
  );
};

// Sub-header

const Subheader = (): React.ReactElement => {
  const dispatch = use_app_dispatch();
  const is_mobile = use_media_query(BREAKPOINTS.down("mobile"));
  const story = use_atom_value(story_metadata_atom);
  const user = story.user!;
  const follower_count =
    use_app_selector((state) => state.entities.follower_counts[user.id]) || 0;
  const is_following = use_app_selector(
    (state) => state.entities.following[user.id]
  );

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
      {is_mobile ? (
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
        <Typography
          as={"time"}
          className={clsx(
            css["flex-center"],
            css["t-minor"],
            styles.x,
            styles.stat
          )}
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
        <Typography
          aria-label={`${get_read_time(story.word_count, user?.wpm)} min read`}
          className={clsx(
            css["flex-center"],
            css["t-minor"],
            styles.x,
            styles.stat
          )}
          level={"body2"}
          title={`${get_read_time(story.word_count, user?.wpm)} min read`}
        >
          <ClockIcon />
          {get_read_time(story.word_count, user?.wpm)} min
        </Typography>
        <Spacer className={css["f-grow"]} />
        <StoryActions />
      </div>
      <Spacer orientation={"vertical"} size={5} />
    </header>
  );
};

export default StoryHeader;
