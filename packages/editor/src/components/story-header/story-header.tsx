import { clsx } from "clsx";
import { useAtom, useAtomValue } from "jotai";
import NextLink from "next/link";
import React from "react";

import Button from "../../../../ui/src/components/button";
import IconButton from "../../../../ui/src/components/icon-button";
import Link from "../../../../ui/src/components/link";
import Menu from "../../../../ui/src/components/menu";
import MenuItem from "../../../../ui/src/components/menu-item";
import Separator from "../../../../ui/src/components/separator";
import Spacer from "../../../../ui/src/components/spacer";
import Typography from "../../../../ui/src/components/typography";
import Persona from "../../../../ui/src/entities/persona";
import { use_clipboard } from "../../../../ui/src/hooks/use-clipboard";
import { use_media_query } from "../../../../ui/src/hooks/use-media-query";
import { use_web_share } from "../../../../ui/src/hooks/use-web-share";
import BookmarkIcon from "~/icons/Bookmark";
import BookmarkPlusIcon from "~/icons/BookmarkPlus";
import CalendarIcon from "~/icons/Calendar";
import ClockIcon from "~/icons/Clock";
import CopyIcon from "~/icons/Copy";
import DotsIcon from "~/icons/Dots";
import MuteIcon from "~/icons/Mute";
import ReportIcon from "~/icons/Report";
import ShareIcon from "~/icons/Share";
import SidebarCollapseIcon from "~/icons/SidebarCollapse";
import SidebarExpandIcon from "~/icons/SidebarExpand";
import UserCheckIcon from "~/icons/UserCheck";
import UserPlusIcon from "~/icons/UserPlus";
import { boolean_action, select_user } from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import { BREAKPOINTS } from "~/theme/breakpoints";
import { abbreviate_number } from "../../../../ui/src/utils/abbreviate-number";
import { DateFormat, format_date } from "../../../../ui/src/utils/format-date";
import { get_read_time } from "../../../../ui/src/utils/get-read-time";

import { sidebarsCollapsedAtom, storyMetadataAtom } from "../../atoms";
import styles from "./story-header.module.scss";

// Actions

const StoryActions = (): React.ReactElement => {
  const isLargerThanDesktop = use_media_query(BREAKPOINTS.up("desktop"));
  const story = use_atom_value(storyMetadataAtom);
  const [sidebarsCollapsed, setSidebarsCollapsed] = use_atom(
    sidebarsCollapsedAtom
  );
  const share = use_web_share();
  const copy = use_clipboard();
  const dispatch = use_app_dispatch();
  const isBookmarked = use_app_selector(
    (state) => state.entities.bookmarks[story.id]
  );
  const isMuted = use_app_selector(
    (state) => state.entities.mutes[story.user!.id]
  );

  return (
    <div className={"flex-center"}>
      <IconButton
        aria-label={`${isBookmarked ? "Un-bookmark" : "Bbookmark"} story`}
        auto_size
        check_auth
        onClick={(): void => {
          dispatch(boolean_action("bookmarks", story.id));
        }}
        title={`${isBookmarked ? "Un-bookmark" : "Bbookmark"} story`}
        variant={"ghost"}
      >
        {isBookmarked ? <BookmarkIcon no_stroke /> : <BookmarkPlusIcon />}
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
        {isLargerThanDesktop && (
          <React.Fragment>
            <Separator />
            <MenuItem
              decorator={
                sidebarsCollapsed ? (
                  <SidebarExpandIcon />
                ) : (
                  <SidebarCollapseIcon />
                )
              }
              onClick={(): void => setSidebarsCollapsed((prev) => !prev)}
            >
              {sidebarsCollapsed ? "Expand" : "Collapse"} sidebars
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
          {isMuted ? "Unmute" : "Mute"} this writer
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
  const story = use_atom_value(storyMetadataAtom);
  const user = story.user!;
  const follower_count =
    use_app_selector((state) => state.entities.follower_counts[user.id]) || 0;
  const isFollowing = use_app_selector(
    (state) => state.entities.following[user.id]
  );

  return (
    <div className={"flex-center"}>
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
      <Spacer className={"f-grow"} size={2} />
      {is_mobile ? (
        <IconButton
          auto_size
          check_auth
          onClick={(): void => {
            dispatch(boolean_action("following", user.id));
          }}
          variant={isFollowing ? "hollow" : "rigid"}
        >
          {isFollowing ? <UserCheckIcon /> : <UserPlusIcon />}
        </IconButton>
      ) : (
        <Button
          auto_size
          check_auth
          decorator={isFollowing ? <UserCheckIcon /> : <UserPlusIcon />}
          onClick={(): void => {
            dispatch(boolean_action("following", user.id));
          }}
          variant={isFollowing ? "hollow" : "rigid"}
        >
          {isFollowing ? "Following" : "Follow"}
        </Button>
      )}
    </div>
  );
};

const StoryHeader = (): React.ReactElement => {
  const is_mobile = use_media_query(BREAKPOINTS.down("mobile"));
  const is_smaller_than_desktop = use_media_query(BREAKPOINTS.down("desktop"));
  const sidebarsCollapsed = use_atom_value(sidebarsCollapsedAtom);
  const story = use_atom_value(storyMetadataAtom);
  const user = use_app_selector(select_user);

  return (
    <header>
      <Typography level={"h1"}>{story.title}</Typography>
      {is_smaller_than_desktop || sidebarsCollapsed ? (
        <React.Fragment>
          <Spacer orientation={"vertical"} size={sidebarsCollapsed ? 4 : 2} />
          <Subheader />
        </React.Fragment>
      ) : null}
      <Spacer orientation={"vertical"} size={2} />
      <div className={clsx("flex-center", styles.metadata)}>
        <Typography
          as={"time"}
          className={clsx("flex-center", "t-minor", styles.x, styles.stat)}
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
          className={clsx("flex-center", "t-minor", styles.x, styles.stat)}
          level={"body2"}
          title={`${get_read_time(story.word_count, user?.wpm)} min read`}
        >
          <ClockIcon />
          {get_read_time(story.word_count, user?.wpm)} min
        </Typography>
        <Spacer className={"f-grow"} />
        <StoryActions />
      </div>
      <Spacer orientation={"vertical"} size={5} />
    </header>
  );
};

export default StoryHeader;
