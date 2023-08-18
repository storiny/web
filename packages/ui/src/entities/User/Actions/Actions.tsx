import { User } from "@storiny/types";
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
import UserXIcon from "~/icons/UserX";
import { selectLoggedIn } from "~/redux/features/auth/selectors";
import {
  selectBlock,
  selectFollower,
  selectMute
} from "~/redux/features/entities/selectors";
import {
  setBlock,
  setFollower,
  setMute,
  syncWithUser,
  toggleBlock,
  toggleFollower,
  toggleMute
} from "~/redux/features/entities/slice";
import { useAppDispatch, useAppSelector } from "~/redux/hooks";
import { breakpoints } from "~/theme/breakpoints";

const Actions = ({ user }: { user: User }): React.ReactElement | null => {
  const share = useWebShare();
  const copy = useClipboard();
  const dispatch = useAppDispatch();
  const isMobile = useMediaQuery(breakpoints.down("mobile"));
  const loggedIn = useAppSelector(selectLoggedIn);
  const isBlocking = useAppSelector(selectBlock(user.id));
  const isMuted = useAppSelector(selectMute(user.id));
  const isFollower = useAppSelector(selectFollower(user.id));
  const [element] = useConfirmation(
    ({ openConfirmation }) => (
      <MenuItem
        decorator={<UserBlockIcon />}
        onSelect={(event): void => {
          event.preventDefault(); // Do not auto-close the menu
          openConfirmation();
        }}
      >
        {isBlocking ? "Unblock" : "Block"} this user
      </MenuItem>
    ),
    {
      color: isBlocking ? "inverted" : "ruby",
      onConfirm: () => dispatch(setBlock([user.id])),
      title: `${isBlocking ? "Unblock" : "Block"} @${user.username}?`,
      description: isBlocking
        ? `The public content you publish will be available to them as well as the ability to follow you.`
        : `Your feed will not include their content, and they will not be able to follow you or interact with your profile.`
    }
  );

  React.useEffect(() => {
    dispatch(syncWithUser(user));
  }, [dispatch, user]);

  if (isMobile) {
    return null;
  }

  return (
    <Menu
      trigger={
        <IconButton
          aria-label={"More options"}
          autoSize
          title={"More options"}
          variant={"ghost"}
        >
          <DotsIcon />
        </IconButton>
      }
    >
      <MenuItem
        decorator={<ShareIcon />}
        onClick={(): void =>
          share(`${user.name} (@${user.username})`, `/${user.username}`)
        }
      >
        Share this user
      </MenuItem>
      <MenuItem
        decorator={<CopyIcon />}
        onClick={(): void => copy(`/${user.username}`)}
      >
        Copy link to profile
      </MenuItem>
      {isFollower && (
        <>
          <Separator />
          <MenuItem
            decorator={<UserXIcon />}
            onClick={(): void => {
              dispatch(setFollower([user.id]));
            }}
          >
            Remove this follower
          </MenuItem>
        </>
      )}
      <Separator />
      {loggedIn && (
        <>
          <MenuItem
            decorator={<MuteIcon />}
            onClick={(): void => {
              dispatch(setMute([user.id]));
            }}
          >
            {isMuted ? "Unmute" : "Mute"} this user
          </MenuItem>
          {element}
        </>
      )}
      <MenuItem
        as={NextLink}
        decorator={<ReportIcon />}
        href={`/report?id=${user.id}&type=user`}
        rel={"noreferrer"}
        target={"_blank"}
      >
        Report this user
      </MenuItem>
    </Menu>
  );
};

export default Actions;
