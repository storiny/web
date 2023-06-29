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
  selectBlock,
  selectFollowing,
  selectFriend,
  selectLoggedIn,
  selectMute,
  selectSentRequest,
  selectSubscribed,
  syncWithUser,
  toggleBlock,
  toggleFriend,
  toggleMute,
  toggleSentRequest,
  toggleSubscription,
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
  const isFollowing = useAppSelector(selectFollowing(profile.id));
  const isBlocking = useAppSelector(selectBlock(profile.id));
  const isMuted = useAppSelector(selectMute(profile.id));
  const isSubscribed = useAppSelector(selectSubscribed(profile.id));
  const isFriend = useAppSelector(selectFriend(profile.id));
  const isFriendRequestSent = useAppSelector(selectSentRequest(profile.id));
  const isSelf = Boolean(profile.is_self);
  const isBlockedByUser = Boolean(profile.is_blocked_by_user);
  const [element, confirm] = useConfirmation(
    <MenuItem
      decorator={<UserBlockIcon />}
      onSelect={(event): void => {
        event.preventDefault(); // Do not auto-close the menu

        confirm({
          color: isBlocking ? "inverted" : "ruby",
          onConfirm: () => dispatch(toggleBlock(profile.id)),
          title: `${isBlocking ? "Unblock" : "Block"} @${profile.username}?`,
          description: isBlocking
            ? `The public content you publish will be available to them as well as the ability to follow you.`
            : `Your feed will not include their content, and they will not be able to follow you or interact with your profile.`,
        });
      }}
    >
      {isBlocking ? "Unblock" : "Block"} this user
    </MenuItem>
  );

  React.useEffect(() => {
    dispatch(
      syncWithUser({
        id: profile.id,
        is_following: profile.is_following,
        is_follower: profile.is_follower,
        is_friend: profile.is_friend,
        is_muted: profile.is_muted,
        is_blocking: profile.is_blocking,
        is_subscribed: profile.is_subscribed,
        is_friend_request_sent: profile.is_friend_request_sent,
        following_count: profile.following_count,
        follower_count: profile.follower_count,
        friend_count: profile.friend_count,
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
              decorator={<XIcon />}
              onClick={(): void => {
                dispatch(toggleSentRequest(profile.id));
              }}
            >
              Cancel request
            </MenuItem>
          ) : isFriend ? (
            <MenuItem
              decorator={<HeartPlusIcon />}
              onClick={(): void => {
                dispatch(toggleFriend(profile.id));
              }}
            >
              Remove friend
            </MenuItem>
          ) : (
            <MenuItem
              decorator={<HeartPlusIcon />}
              onClick={(): void => {
                dispatch(toggleSentRequest(profile.id));
              }}
            >
              Send friend request
            </MenuItem>
          )}
          {isFollowing && (
            <MenuItem
              decorator={isSubscribed ? <BellFilledIcon /> : <BellPlusIcon />}
              onClick={(): void => {
                dispatch(toggleSubscription(profile.id));
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
            `/${profile.username}`
          )
        }
      >
        Share this user
      </MenuItem>
      <MenuItem
        decorator={<CopyIcon />}
        onClick={(): void => copy(`/${profile.username}`)}
      >
        Copy link to profile
      </MenuItem>
      {!isSelf && <Separator />}
      {!isSelf && !isBlockedByUser && loggedIn ? (
        <>
          <MenuItem
            decorator={<MuteIcon />}
            onClick={(): void => {
              dispatch(toggleMute(profile.id));
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
