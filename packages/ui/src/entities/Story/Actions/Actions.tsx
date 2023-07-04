import { Story } from "@storiny/types";
import { clsx } from "clsx";
import NextLink from "next/link";
import React from "react";

import { useConfirmation } from "~/components/Confirmation";
import IconButton from "~/components/IconButton";
import Menu from "~/components/Menu";
import MenuItem from "~/components/MenuItem";
import Separator from "~/components/Separator";
import { useClipboard } from "~/hooks/useClipboard";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import { useWebShare } from "~/hooks/useWebShare";
import CopyIcon from "~/icons/Copy";
import DotsIcon from "~/icons/Dots";
import MuteIcon from "~/icons/Mute";
import ReportIcon from "~/icons/Report";
import ShareIcon from "~/icons/Share";
import UserBlockIcon from "~/icons/UserBlock";
import { selectLoggedIn } from "~/redux/features/auth/selectors";
import { selectBlock, selectMute } from "~/redux/features/entities/selectors";
import { toggleBlock, toggleMute } from "~/redux/features/entities/slice";
import { useAppDispatch, useAppSelector } from "~/redux/hooks";
import { breakpoints } from "~/theme/breakpoints";

const Actions = ({ story }: { story: Story }): React.ReactElement => {
  const share = useWebShare();
  const copy = useClipboard();
  const dispatch = useAppDispatch();
  const isMobile = useMediaQuery(breakpoints.down("mobile"));
  const loggedIn = useAppSelector(selectLoggedIn);
  const isBlocking = useAppSelector(selectBlock(story.user.id));
  const isMuted = useAppSelector(selectMute(story.user.id));
  const [element, confirm] = useConfirmation(
    <MenuItem
      decorator={<UserBlockIcon />}
      onSelect={(event): void => {
        event.preventDefault(); // Do not auto-close the menu

        confirm({
          color: isBlocking ? "inverted" : "ruby",
          onConfirm: () => dispatch(toggleBlock(story.user.id)),
          title: `${isBlocking ? "Unblock" : "Block"} @${story.user.username}?`,
          description: isBlocking
            ? `The public content you publish will be available to them as well as the ability to follow you.`
            : `Your feed will not include their content, and they will not be able to follow you or interact with your profile.`
        });
      }}
    >
      {isBlocking ? "Unblock" : "Block"} this writer
    </MenuItem>
  );

  return (
    <Menu
      trigger={
        <IconButton
          aria-label={"More options"}
          className={clsx(isMobile && "force-light-mode")}
          size={isMobile ? "lg" : "md"}
          title={"More options"}
          variant={isMobile ? "rigid" : "ghost"}
        >
          <DotsIcon />
        </IconButton>
      }
    >
      <MenuItem
        decorator={<ShareIcon />}
        onClick={(): void =>
          share(story.title, `/${story.user.username}/${story.slug}`)
        }
      >
        Share this story
      </MenuItem>
      <MenuItem
        decorator={<CopyIcon />}
        onClick={(): void => copy(`/${story.user.username}/${story.slug}`)}
      >
        Copy link to story
      </MenuItem>
      <Separator />
      <MenuItem
        as={NextLink}
        decorator={<ReportIcon />}
        href={`/report?id=${story.id}&type=story`}
        rel={"noreferrer"}
        target={"_blank"}
      >
        Report this story
      </MenuItem>
      {loggedIn && (
        <>
          <Separator />
          <MenuItem
            decorator={<MuteIcon />}
            onClick={(): void => {
              dispatch(toggleMute(story.user.id));
            }}
          >
            {isMuted ? "Unmute" : "Mute"} this writer
          </MenuItem>
          {element}
        </>
      )}
    </Menu>
  );
};

export default Actions;
