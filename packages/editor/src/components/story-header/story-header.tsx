import { clsx } from "clsx";
import { useAtom, useAtomValue } from "jotai";
import NextLink from "next/link";
import React from "react";

import Button from "~/components/Button";
import IconButton from "~/components/IconButton";
import Link from "~/components/Link";
import Menu from "~/components/Menu";
import MenuItem from "~/components/MenuItem";
import Separator from "~/components/Separator";
import Spacer from "~/components/Spacer";
import Typography from "~/components/Typography";
import Persona from "~/entities/Persona";
import { useClipboard } from "~/hooks/useClipboard";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import { useWebShare } from "~/hooks/useWebShare";
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
import {
  selectUser,
  setBookmark,
  setFollowing,
  setMute
} from "~/redux/features";
import { useAppDispatch, useAppSelector } from "~/redux/hooks";
import { breakpoints } from "~/theme/breakpoints";
import { abbreviateNumber } from "~/utils/abbreviateNumber";
import { DateFormat, formatDate } from "~/utils/formatDate";
import { getReadTime } from "~/utils/getReadTime";

import { sidebarsCollapsedAtom, storyMetadataAtom } from "../../atoms";
import styles from "./story-header.module.scss";

// Actions

const StoryActions = (): React.ReactElement => {
  const isLargerThanDesktop = useMediaQuery(breakpoints.up("desktop"));
  const story = useAtomValue(storyMetadataAtom);
  const [sidebarsCollapsed, setSidebarsCollapsed] = useAtom(
    sidebarsCollapsedAtom
  );
  const share = useWebShare();
  const copy = useClipboard();
  const dispatch = useAppDispatch();
  const isBookmarked = useAppSelector(
    (state) => state.entities.bookmarks[story.id]
  );
  const isMuted = useAppSelector(
    (state) => state.entities.mutes[story.user!.id]
  );

  return (
    <div className={"flex-center"}>
      <IconButton
        aria-label={`${isBookmarked ? "Un-bookmark" : "Bbookmark"} story`}
        autoSize
        checkAuth
        onClick={(): void => {
          dispatch(setBookmark([story.id]));
        }}
        title={`${isBookmarked ? "Un-bookmark" : "Bbookmark"} story`}
        variant={"ghost"}
      >
        {isBookmarked ? <BookmarkIcon noStroke /> : <BookmarkPlusIcon />}
      </IconButton>
      <Menu
        trigger={
          <IconButton
            aria-label={"Story options"}
            autoSize
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
          checkAuth
          decorator={<MuteIcon />}
          onClick={(): void => {
            dispatch(setMute([story.user!.id]));
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
  const dispatch = useAppDispatch();
  const isMobile = useMediaQuery(breakpoints.down("mobile"));
  const story = useAtomValue(storyMetadataAtom);
  const user = story.user!;
  const followerCount =
    useAppSelector((state) => state.entities.followerCounts[user.id]) || 0;
  const isFollowing = useAppSelector(
    (state) => state.entities.following[user.id]
  );

  return (
    <div className={"flex-center"}>
      <Persona
        avatar={{
          alt: `${user?.name}'s avatar`,
          avatarId: user?.avatar_id,
          label: user?.name,
          hex: user?.avatar_hex
        }}
        componentProps={{
          secondaryText: {
            ellipsis: true
          }
        }}
        primaryText={
          <Link ellipsis fixedColor href={`/${user.username}`}>
            {user.name}
          </Link>
        }
        secondaryText={
          <>
            @{user.username} &bull; {abbreviateNumber(followerCount)}{" "}
            {followerCount === 1 ? "follower" : "followers"}
          </>
        }
        size={"lg"}
      />
      <Spacer className={"f-grow"} size={2} />
      {isMobile ? (
        <IconButton
          autoSize
          checkAuth
          onClick={(): void => {
            dispatch(setFollowing([user.id]));
          }}
          variant={isFollowing ? "hollow" : "rigid"}
        >
          {isFollowing ? <UserCheckIcon /> : <UserPlusIcon />}
        </IconButton>
      ) : (
        <Button
          autoSize
          checkAuth
          decorator={isFollowing ? <UserCheckIcon /> : <UserPlusIcon />}
          onClick={(): void => {
            dispatch(setFollowing([user.id]));
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
  const isMobile = useMediaQuery(breakpoints.down("mobile"));
  const isSmallerThanDesktop = useMediaQuery(breakpoints.down("desktop"));
  const sidebarsCollapsed = useAtomValue(sidebarsCollapsedAtom);
  const story = useAtomValue(storyMetadataAtom);
  const user = useAppSelector(selectUser);

  return (
    <header>
      <Typography level={"h1"}>{story.title}</Typography>
      {isSmallerThanDesktop || sidebarsCollapsed ? (
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
          title={formatDate(story.published_at!, DateFormat.LONG)}
        >
          <CalendarIcon />
          <span>
            {formatDate(
              story.published_at!,
              isMobile ? DateFormat.SHORT : DateFormat.STANDARD
            )}
          </span>
        </Typography>
        <Typography
          aria-label={`${getReadTime(story.word_count, user?.wpm)} min read`}
          className={clsx("flex-center", "t-minor", styles.x, styles.stat)}
          level={"body2"}
          title={`${getReadTime(story.word_count, user?.wpm)} min read`}
        >
          <ClockIcon />
          {getReadTime(story.word_count, user?.wpm)} min
        </Typography>
        <Spacer className={"f-grow"} />
        <StoryActions />
      </div>
      <Spacer orientation={"vertical"} size={5} />
    </header>
  );
};

export default StoryHeader;
