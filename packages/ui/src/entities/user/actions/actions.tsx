import React from "react";

import Button from "~/components/button";
import { use_confirmation } from "~/components/confirmation";
import IconButton from "~/components/icon-button";
import Menu from "~/components/menu";
import MenuItem from "~/components/menu-item";
import Separator from "~/components/separator";
import ReportModal from "~/entities/report-modal";
import { use_clipboard } from "~/hooks/use-clipboard";
import { use_media_query } from "~/hooks/use-media-query";
import { use_web_share } from "~/hooks/use-web-share";
import CopyIcon from "~/icons/copy";
import DotsIcon from "~/icons/dots";
import MuteIcon from "~/icons/mute";
import ReportIcon from "~/icons/report";
import ShareIcon from "~/icons/share";
import UserBlockIcon from "~/icons/user-block";
import UserXIcon from "~/icons/user-x";
import { boolean_action, select_user } from "~/redux/features";
import { select_is_logged_in } from "~/redux/features/auth/selectors";
import { sync_with_user } from "~/redux/features/entities/slice";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import { BREAKPOINTS } from "~/theme/breakpoints";

import { UserActionsProps } from "./actions.props";

const UserActions = (props: UserActionsProps): React.ReactElement | null => {
  const { user, action_type } = props;
  const share = use_web_share();
  const copy = use_clipboard();
  const dispatch = use_app_dispatch();
  const is_mobile = use_media_query(BREAKPOINTS.down("mobile"));
  const logged_in = use_app_selector(select_is_logged_in);
  const current_user = use_app_selector(select_user);
  const is_blocking = use_app_selector(
    (state) => state.entities.blocks[user.id]
  );
  const is_muted = use_app_selector((state) => state.entities.mutes[user.id]);
  const is_follower = use_app_selector(
    (state) => state.entities.followers[user.id]
  );
  const is_self = current_user?.id === user.id;

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
        {is_blocking ? "Unblock" : "Block"} this user
      </MenuItem>
    ),
    {
      color: is_blocking ? "inverted" : "ruby",
      on_confirm: () => dispatch(boolean_action("blocks", user.id)),
      title: `${is_blocking ? "Unblock" : "Block"} @${user.username}?`,
      description: is_blocking
        ? `The public content you publish will be available to them as well as the ability to follow you.`
        : `Your feed will not include their content, and they will not be able to follow you or interact with your profile.`
    }
  );

  if (is_mobile && action_type === "default") {
    return null;
  }

  return action_type === "default" ? (
    <Menu
      trigger={
        <IconButton
          aria-label={"More options"}
          auto_size
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
      {is_follower && (
        <>
          <Separator />
          <MenuItem
            check_auth
            decorator={<UserXIcon />}
            onClick={(): void => {
              dispatch(boolean_action("followers", user.id, false));
            }}
          >
            Remove this follower
          </MenuItem>
        </>
      )}
      {!is_self && (
        <>
          <Separator />
          {logged_in && (
            <>
              <MenuItem
                check_auth
                decorator={<MuteIcon />}
                onClick={(): void => {
                  dispatch(boolean_action("mutes", user.id));
                }}
              >
                {is_muted ? "Unmute" : "Mute"} this user
              </MenuItem>
              {element}
            </>
          )}
          <ReportModal
            entity_id={user.id}
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
        </>
      )}
    </Menu>
  ) : (
    <Button
      auto_size
      check_auth
      onClick={(): void => {
        dispatch(
          boolean_action(action_type === "block" ? "blocks" : "mutes", user.id)
        );
      }}
      variant={
        (action_type === "block" ? is_blocking : is_muted) ? "rigid" : "hollow"
      }
    >
      {action_type === "block"
        ? is_blocking
          ? "Unblock"
          : "Block"
        : is_muted
        ? "Unmute"
        : "Mute"}
    </Button>
  );
};

export default UserActions;
