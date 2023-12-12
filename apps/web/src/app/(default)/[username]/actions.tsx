import { is_num } from "@storiny/shared/src/utils/is-num";
import React from "react";

import { GetProfileResponse } from "~/common/grpc";
import { use_confirmation } from "~/components/confirmation";
import IconButton from "~/components/icon-button";
import Menu from "~/components/menu";
import MenuItem from "~/components/menu-item";
import Separator from "~/components/separator";
import { use_toast } from "~/components/toast";
import ReportModal from "~/entities/report-modal";
import { use_clipboard } from "~/hooks/use-clipboard";
import { use_web_share } from "~/hooks/use-web-share";
import BellFilledIcon from "~/icons/bell-filled";
import BellPlusIcon from "~/icons/bell-plus";
import CopyIcon from "~/icons/copy";
import DotsIcon from "~/icons/dots";
import HeartOffIcon from "~/icons/heart-off";
import HeartPlusIcon from "~/icons/heart-plus";
import MuteIcon from "~/icons/mute";
import ReportIcon from "~/icons/report";
import ShareIcon from "~/icons/share";
import UserBlockIcon from "~/icons/user-block";
import XIcon from "~/icons/x";
import {
  boolean_action,
  select_is_logged_in,
  sync_with_user,
  use_cancel_friend_request_mutation,
  use_send_friend_request_mutation
} from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import { handle_api_error } from "~/utils/handle-api-error";

interface Props {
  is_inside_sidebar?: boolean;
  profile: GetProfileResponse;
}

const SendFriendRequestItem = ({
  user_id
}: {
  user_id: string;
}): React.ReactElement => {
  const toast = use_toast();
  const [send_friend_request, { isLoading: is_loading }] =
    use_send_friend_request_mutation();

  const handle_send_friend_request = (): void => {
    send_friend_request({ id: user_id })
      .unwrap()
      .then(() => {
        toast("Your friend request was sent", "success");
      })
      .catch((error) =>
        handle_api_error(
          error,
          toast,
          null,
          "Could not send your friend request"
        )
      );
  };

  return (
    <MenuItem
      check_auth
      decorator={<HeartPlusIcon />}
      disabled={is_loading}
      onClick={handle_send_friend_request}
      // Do not auto close the menu
      onSelect={(event): void => event.preventDefault()}
    >
      Send friend request
    </MenuItem>
  );
};

const CancelFriendRequestItem = ({
  user_id
}: {
  user_id: string;
}): React.ReactElement => {
  const toast = use_toast();
  const [cancel_friend_request, { isLoading: is_loading }] =
    use_cancel_friend_request_mutation();

  const handle_cancel_friend_request = (): void => {
    cancel_friend_request({ id: user_id })
      .unwrap()
      .then(() => {
        toast("Cancelled your friend request", "success");
      })
      .catch((error) =>
        handle_api_error(
          error,
          toast,
          null,
          "Could not cancel your friend request"
        )
      );
  };

  return (
    <MenuItem
      check_auth
      decorator={<XIcon />}
      disabled={is_loading}
      onClick={handle_cancel_friend_request}
      // Do not auto close the menu
      onSelect={(event): void => event.preventDefault()}
    >
      Cancel request
    </MenuItem>
  );
};

const Actions = ({ profile, is_inside_sidebar }: Props): React.ReactElement => {
  const share = use_web_share();
  const copy = use_clipboard();
  const dispatch = use_app_dispatch();
  const logged_in = use_app_selector(select_is_logged_in);
  const is_following = use_app_selector(
    (state) => state.entities.following[profile.id]
  );
  const is_blocked = use_app_selector(
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
        onSelect={(event): void => {
          event.preventDefault(); // Do not auto-close the menu
          open_confirmation();
        }}
      >
        {is_blocked ? "Unblock" : "Block"} this user
      </MenuItem>
    ),
    {
      color: is_blocked ? "inverted" : "ruby",
      on_confirm: () => dispatch(boolean_action("blocks", profile.id)),
      title: `${is_blocked ? "Unblock" : "Block"} @${profile.username}?`,
      description: is_blocked
        ? `The public content you publish will be available to them as well as the ability to follow you.`
        : `Your feed will not include their content, and they will not be able to follow you or interact with your profile.`
    }
  );

  const [remove_friend_element] = use_confirmation(
    ({ open_confirmation }) => (
      <MenuItem
        check_auth
        decorator={<HeartOffIcon />}
        onSelect={(event): void => {
          event.preventDefault(); // Do not auto-close the menu
          open_confirmation();
        }}
      >
        Remove friend
      </MenuItem>
    ),
    {
      color: "ruby",
      on_confirm: () => dispatch(boolean_action("friends", profile.id, false)),
      title: `Unfriend @${profile.username}?`,
      description: "Are you sure you want to remove this user as friend?"
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
      {!is_self && !is_blocked_by_user && !is_blocked && logged_in ? (
        <>
          {is_friend_request_sent ? (
            <CancelFriendRequestItem user_id={profile.id} />
          ) : is_friend ? (
            remove_friend_element
          ) : (
            <SendFriendRequestItem user_id={profile.id} />
          )}
          {is_following && (
            <MenuItem
              check_auth
              decorator={is_subscribed ? <BellFilledIcon /> : <BellPlusIcon />}
              onClick={(): void => {
                dispatch(
                  boolean_action("subscriptions", profile.id, undefined, {
                    // This forces a request to the server.
                    source: "user"
                  })
                );
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
        <ReportModal
          entity_id={profile.id}
          entity_type={"user"}
          trigger={({ open_modal }): React.ReactElement => (
            <MenuItem
              decorator={<ReportIcon />}
              onClick={open_modal}
              onSelect={(event): void => event.preventDefault()}
            >
              Report this user
            </MenuItem>
          )}
        />
      )}
    </Menu>
  );
};

export default Actions;
