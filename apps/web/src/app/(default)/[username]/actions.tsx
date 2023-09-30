import NextLink from "next/link";
import React from "react";

import { GetProfileResponse } from "~/common/grpc";
import { use_confirmation } from "../../../../../../packages/ui/src/components/confirmation";
import IconButton from "../../../../../../packages/ui/src/components/icon-button";
import Menu from "../../../../../../packages/ui/src/components/menu";
import MenuItem from "../../../../../../packages/ui/src/components/menu-item";
import Separator from "../../../../../../packages/ui/src/components/separator";
import { use_clipboard } from "../../../../../../packages/ui/src/hooks/use-clipboard";
import { use_web_share } from "../../../../../../packages/ui/src/hooks/use-web-share";
import BellFilledIcon from "../../../../../../packages/ui/src/icons/bell-filled";
import BellPlusIcon from "../../../../../../packages/ui/src/icons/bell-plus";
import CopyIcon from "../../../../../../packages/ui/src/icons/copy";
import DotsIcon from "../../../../../../packages/ui/src/icons/dots";
import HeartPlusIcon from "../../../../../../packages/ui/src/icons/heart-plus";
import MuteIcon from "../../../../../../packages/ui/src/icons/mute";
import ReportIcon from "../../../../../../packages/ui/src/icons/report";
import ShareIcon from "../../../../../../packages/ui/src/icons/share";
import UserBlockIcon from "../../../../../../packages/ui/src/icons/user-block";
import XIcon from "../../../../../../packages/ui/src/icons/x";
import {
  boolean_action,
  select_is_logged_in,
  sync_with_user
} from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import { is_num } from "@storiny/shared/src/utils/is-num";

interface Props {
  is_inside_sidebar?: boolean;
  profile: GetProfileResponse;
}

const Actions = ({ profile, is_inside_sidebar }: Props): React.ReactElement => {
  const share = use_web_share();
  const copy = use_clipboard();
  const dispatch = use_app_dispatch();
  const logged_in = use_app_selector(select_is_logged_in);
  const is_following = use_app_selector(
    (state) => state.entities.following[profile.id]
  );
  const is_blocking = use_app_selector(
    (state) => state.entities.blocks[profile.id]
  );
  const is_muted = use_app_selector(
    (state) => state.entities.mutes[profile.id]
  );
  const is_subscribed = use_app_selector(
    (state) => state.entities.subscriptions[profile.id]
  );
  const is_friend = use_app_selector(
    (state) => state.entities.friends[profile.id]
  );
  const is_friend_request_sent = use_app_selector(
    (state) => state.entities.sent_requests[profile.id]
  );
  const is_self = Boolean(profile.is_self);
  const is_blocked_by_user = Boolean(profile.is_blocked_by_user);

  const [element] = use_confirmation(
    ({ open_confirmation }) => (
      <MenuItem
        check_auth
        decorator={<UserBlockIcon />}
        onSelect={(event: Event): void => {
          event.preventDefault(); // Do not auto-close the menu
          open_confirmation();
        }}
      >
        {is_blocking ? "Unblock" : "Block"} this user
      </MenuItem>
    ),
    {
      color: is_blocking ? "inverted" : "ruby",
      on_confirm: () => dispatch(boolean_action("blocks", profile.id)),
      title: `${is_blocking ? "Unblock" : "Block"} @${profile.username}?`,
      description: is_blocking
        ? `The public content you publish will be available to them as well as the ability to follow you.`
        : `Your feed will not include their content, and they will not be able to follow you or interact with your profile.`
    }
  );

  React.useEffect(() => {
    dispatch(
      sync_with_user({
        ...profile,
        following_count: is_num(profile.following_count)
          ? profile.following_count
          : null,
        friend_count: is_num(profile.friend_count) ? profile.friend_count : null
      })
    );
  }, [dispatch, profile]);

  return (
    <Menu
      trigger={
        <IconButton
          aria-label={"Profile options"}
          size={is_inside_sidebar ? "md" : "lg"}
          title={"Profile options"}
          variant={"ghost"}
        >
          <DotsIcon />
        </IconButton>
      }
    >
      {!is_self && !is_blocked_by_user && !is_blocking && logged_in ? (
        <>
          {is_friend_request_sent ? (
            <MenuItem
              check_auth
              decorator={<XIcon />}
              onClick={(): void => {
                dispatch(boolean_action("sent_requests", profile.id));
              }}
            >
              Cancel request
            </MenuItem>
          ) : is_friend ? (
            <MenuItem
              check_auth
              decorator={<HeartPlusIcon />}
              onClick={(): void => {
                dispatch(boolean_action("friends", profile.id, false));
              }}
            >
              Remove friend
            </MenuItem>
          ) : (
            <MenuItem
              check_auth
              decorator={<HeartPlusIcon />}
              onClick={(): void => {
                dispatch(boolean_action("sent_requests", profile.id));
              }}
            >
              Send friend request
            </MenuItem>
          )}
          {is_following && (
            <MenuItem
              check_auth
              decorator={is_subscribed ? <BellFilledIcon /> : <BellPlusIcon />}
              onClick={(): void => {
                dispatch(boolean_action("subscriptions", profile.id));
              }}
            >
              {is_subscribed ? "Unsubscribe" : "Subscribe"}
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
      {!is_self && <Separator />}
      {!is_self && !is_blocked_by_user && logged_in ? (
        <>
          <MenuItem
            check_auth
            decorator={<MuteIcon />}
            onClick={(): void => {
              dispatch(boolean_action("mutes", profile.id));
            }}
          >
            {is_muted ? "Unmute" : "Mute"} this user
          </MenuItem>
          {element}
        </>
      ) : null}
      {!is_self && (
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
