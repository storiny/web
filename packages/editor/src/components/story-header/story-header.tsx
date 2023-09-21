import { clsx } from "clsx";
import { useAtomValue } from "jotai";
import NextLink from "next/link";
import React from "react";

import IconButton from "~/components/IconButton";
import Menu from "~/components/Menu";
import MenuItem from "~/components/MenuItem";
import Separator from "~/components/Separator";
import Spacer from "~/components/Spacer";
import Typography from "~/components/Typography";
import { useClipboard } from "~/hooks/useClipboard";
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
import { selectUser, setBookmark, setMute } from "~/redux/features";
import { useAppDispatch, useAppSelector } from "~/redux/hooks";
import { DateFormat, formatDate } from "~/utils/formatDate";
import { getReadTime } from "~/utils/getReadTime";

import { storyMetadataAtom } from "../../atoms";
import styles from "./story-header.module.scss";

// Actions

const StoryActions = (): React.ReactElement => {
  const story = useAtomValue(storyMetadataAtom);
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

const StoryHeader = (): React.ReactElement => {
  const story = useAtomValue(storyMetadataAtom);
  const user = useAppSelector(selectUser);

  return (
    <header>
      <Typography level={"h1"}>{story.title}</Typography>
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
          <span>{formatDate(story.published_at!, DateFormat.STANDARD)}</span>
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
