import NextLink from "next/link";
import React from "react";

import Button from "~/components/Button";
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
import { select_is_logged_in } from "~/redux/features/auth/selectors";
import {
  boolean_action,
  setMute,
  sync_with_user
} from "~/redux/features/entities/slice";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import { breakpoints } from "~/theme/breakpoints";

import { UserActionsProps } from "./actions.props";

const UserActions = (props: UserActionsProps): React.ReactElement | null => {
  const { user, actionType } = props;
  const share = useWebShare();
  const copy = useClipboard();
  const dispatch = use_app_dispatch();
  const isMobile = useMediaQuery(breakpoints.down("mobile"));
  const loggedIn = use_app_selector(select_is_logged_in);
  const isBlocking = use_app_selector(
    (state) => state.entities.blocks[user.id]
  );
  const isMuted = use_app_selector((state) => state.entities.mutes[user.id]);
  const isFollower = use_app_selector(
    (state) => state.entities.followers[user.id]
  );
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
      onConfirm: () => dispatch(boolean_action("blocks", user.id)),
      title: `${isBlocking ? "Unblock" : "Block"} @${user.username}?`,
      description: isBlocking
        ? `The public content you publish will be available to them as well as the ability to follow you.`
        : `Your feed will not include their content, and they will not be able to follow you or interact with your profile.`
    }
  );

  React.useEffect(() => {
    dispatch(sync_with_user(user));
  }, [dispatch, user]);

  if (isMobile && actionType === "default") {
    return null;
  }

  return actionType === "default" ? (
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
          share(
            `${user.name} (@${user.username})`,
            `${process.env.NEXT_PUBLIC_WEB_URL}/${user.username}`
          )
        }
      >
        Share this user
      </MenuItem>
      <MenuItem
        decorator={<CopyIcon />}
        onClick={(): void =>
          copy(`${process.env.NEXT_PUBLIC_WEB_URL}/${user.username}`)
        }
      >
        Copy link to profile
      </MenuItem>
      {isFollower && (
        <>
          <Separator />
          <MenuItem
            checkAuth
            decorator={<UserXIcon />}
            onClick={(): void => {
              dispatch(boolean_action("followers", user.id, false));
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
            checkAuth
            decorator={<MuteIcon />}
            onClick={(): void => {
              dispatch(boolean_action("mutes", user.id));
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
  ) : (
    <Button
      autoSize
      checkAuth
      onClick={(): void => {
        dispatch(
          boolean_action(actionType === "block" ? "blocks" : "mutes", user.id)
        );
      }}
      variant={
        (actionType === "block" ? isBlocking : isMuted) ? "rigid" : "hollow"
      }
    >
      {actionType === "block"
        ? isBlocking
          ? "Unblock"
          : "Block"
        : isMuted
        ? "Unmute"
        : "Mute"}
    </Button>
  );
};

export default UserActions;
