import NextLink from "next/link";
import React from "react";

import { GetProfileResponse } from "~/common/grpc";
import { useConfirmation } from "~/components/Confirmation";
import IconButton from "~/components/IconButton";
import Menu from "~/components/Menu";
import MenuItem from "~/components/MenuItem";
import Separator from "~/components/Separator";
import { useClipboard } from "~/hooks/useClipboard";
import { useWebShare } from "~/hooks/useWebShare";
import BellFilledIcon from "~/icons/BellFilled";
import BellPlusIcon from "~/icons/BellPlus";
import CopyIcon from "~/icons/Copy";
import DotsIcon from "~/icons/Dots";
import HeartPlusIcon from "~/icons/HeartPlus";
import MuteIcon from "~/icons/Mute";
import ReportIcon from "~/icons/Report";
import ShareIcon from "~/icons/Share";
import UserBlockIcon from "~/icons/UserBlock";
import XIcon from "~/icons/X";
import {
  selectLoggedIn,
  setBlock,
  setFriend,
  setMute,
  setSentRequest,
  setSubscription,
  syncWithUser
} from "~/redux/features";
import { useAppDispatch, useAppSelector } from "~/redux/hooks";

interface Props {
  isInsideSidebar?: boolean;
  profile: GetProfileResponse;
}

const Actions = ({ profile, isInsideSidebar }: Props): React.ReactElement => {
  const share = useWebShare();
  const copy = useClipboard();
  const dispatch = useAppDispatch();
  const loggedIn = useAppSelector(selectLoggedIn);
  const isFollowing = useAppSelector(
    (state) => state.entities.following[profile.id]
  );
  const isBlocking = useAppSelector(
    (state) => state.entities.blocks[profile.id]
  );
  const isMuted = useAppSelector((state) => state.entities.mutes[profile.id]);
  const isSubscribed = useAppSelector(
    (state) => state.entities.subscriptions[profile.id]
  );
  const isFriend = useAppSelector(
    (state) => state.entities.friends[profile.id]
  );
  const isFriendRequestSent = useAppSelector(
    (state) => state.entities.sentRequests[profile.id]
  );
  const isSelf = Boolean(profile.is_self);
  const isBlockedByUser = Boolean(profile.is_blocked_by_user);
  const [element] = useConfirmation(
    ({ openConfirmation }) => (
      <MenuItem
        checkAuth
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
      onConfirm: () => dispatch(setBlock([profile.id])),
      title: `${isBlocking ? "Unblock" : "Block"} @${profile.username}?`,
      description: isBlocking
        ? `The public content you publish will be available to them as well as the ability to follow you.`
        : `Your feed will not include their content, and they will not be able to follow you or interact with your profile.`
    }
  );

  React.useEffect(() => {
    dispatch(
      syncWithUser({
        ...profile,
        following_count:
          typeof profile.following_count === "number"
            ? profile.following_count
            : null,
        friend_count:
          typeof profile.friend_count === "number" ? profile.friend_count : null
      })
    );
  }, [dispatch, profile]);

  return (
    <Menu
      trigger={
        <IconButton
          aria-label={"Profile options"}
          size={isInsideSidebar ? "md" : "lg"}
          title={"Profile options"}
          variant={"ghost"}
        >
          <DotsIcon />
        </IconButton>
      }
    >
      {!isSelf && !isBlockedByUser && !isBlocking && loggedIn ? (
        <>
          {isFriendRequestSent ? (
            <MenuItem
              checkAuth
              decorator={<XIcon />}
              onClick={(): void => {
                dispatch(setSentRequest([profile.id]));
              }}
            >
              Cancel request
            </MenuItem>
          ) : isFriend ? (
            <MenuItem
              checkAuth
              decorator={<HeartPlusIcon />}
              onClick={(): void => {
                dispatch(setFriend([profile.id]));
              }}
            >
              Remove friend
            </MenuItem>
          ) : (
            <MenuItem
              checkAuth
              decorator={<HeartPlusIcon />}
              onClick={(): void => {
                dispatch(setSentRequest([profile.id]));
              }}
            >
              Send friend request
            </MenuItem>
          )}
          {isFollowing && (
            <MenuItem
              checkAuth
              decorator={isSubscribed ? <BellFilledIcon /> : <BellPlusIcon />}
              onClick={(): void => {
                dispatch(setSubscription([profile.id]));
              }}
            >
              {isSubscribed ? "Unsubscribe" : "Subscribe"}
            </MenuItem>
          )}
          <Separator />
        </>
      ) : null}
      <MenuItem
        decorator={<ShareIcon />}
        onClick={(): void =>
          share(
            `${profile.name} (@${profile.username})`,
            `${process.env.NEXT_PUBLIC_WEB_URL}/${profile.username}`
          )
        }
      >
        Share this user
      </MenuItem>
      <MenuItem
        decorator={<CopyIcon />}
        onClick={(): void =>
          copy(`${process.env.NEXT_PUBLIC_WEB_URL}/${profile.username}`)
        }
      >
        Copy link to profile
      </MenuItem>
      {!isSelf && <Separator />}
      {!isSelf && !isBlockedByUser && loggedIn ? (
        <>
          <MenuItem
            checkAuth
            decorator={<MuteIcon />}
            onClick={(): void => {
              dispatch(setMute([profile.id]));
            }}
          >
            {isMuted ? "Unmute" : "Mute"} this user
          </MenuItem>
          {element}
        </>
      ) : null}
      {!isSelf && (
        <MenuItem
          as={NextLink}
          decorator={<ReportIcon />}
          href={`/report?id=${profile.id}&type=user`}
          rel={"noreferrer"}
          target={"_blank"}
        >
          Report this user
        </MenuItem>
      )}
    </Menu>
  );
};

export default Actions;
