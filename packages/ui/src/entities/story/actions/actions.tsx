import { SUPPORT_ARTICLE_MAP } from "@storiny/shared/src/constants/support-articles";
import { Story } from "@storiny/types";
import { clsx } from "clsx";
import NextLink from "next/link";
import React from "react";

import { use_confirmation } from "~/components/confirmation";
import IconButton from "~/components/icon-button";
import Link from "~/components/link";
import Menu from "~/components/menu";
import MenuItem from "~/components/menu-item";
import Separator from "~/components/separator";
import { use_toast } from "~/components/toast";
import ReportModal from "~/entities/report-modal";
import { use_clipboard } from "~/hooks/use-clipboard";
import { use_media_query } from "~/hooks/use-media-query";
import { use_web_share } from "~/hooks/use-web-share";
import CommentIcon from "~/icons/comment";
import CopyIcon from "~/icons/copy";
import DotsIcon from "~/icons/dots";
import EditIcon from "~/icons/edit";
import EyeOffIcon from "~/icons/eye-off";
import MuteIcon from "~/icons/mute";
import ReportIcon from "~/icons/report";
import ShareIcon from "~/icons/share";
import StoriesMetricsIcon from "~/icons/stories-metrics";
import TrashIcon from "~/icons/trash";
import UserBlockIcon from "~/icons/user-block";
import {
  boolean_action,
  get_drafts_api,
  get_stories_api,
  select_user,
  use_delete_draft_mutation,
  use_delete_story_mutation,
  use_unpublish_story_mutation
} from "~/redux/features";
import { select_is_logged_in } from "~/redux/features/auth/selectors";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import { BREAKPOINTS } from "~/theme/breakpoints";
import { handle_api_error } from "~/utils/handle-api-error";

const StoryActions = ({
  story,
  is_draft,
  is_extended
}: {
  is_draft?: boolean;
  is_extended?: boolean;
  story: Story;
}): React.ReactElement => {
  const toast = use_toast();
  const share = use_web_share(toast);
  const copy = use_clipboard();
  const dispatch = use_app_dispatch();
  const is_mobile = use_media_query(BREAKPOINTS.down("mobile"));
  const logged_in = use_app_selector(select_is_logged_in);
  const current_user = use_app_selector(select_user);
  const is_blocked = use_app_selector(
    (state) => state.entities.blocks[story.user?.id || ""]
  );
  const is_muted = use_app_selector(
    (state) => state.entities.mutes[story.user?.id || ""]
  );
  const is_self = current_user?.id === (story.user_id || story.user?.id);

  const [delete_draft] = use_delete_draft_mutation();
  const [delete_story] = use_delete_story_mutation();
  const [unpublish_story] = use_unpublish_story_mutation();

  const [block_element] = use_confirmation(
    ({ open_confirmation }) => (
      <MenuItem
        check_auth
        decorator={<UserBlockIcon />}
        onSelect={(event): void => {
          event.preventDefault(); // Do not auto-close the menu
          event.stopPropagation();
          open_confirmation();
        }}
      >
        {is_blocked ? "Unblock" : "Block"} this writer
      </MenuItem>
    ),
    {
      color: is_blocked ? "inverted" : "ruby",
      on_confirm: () =>
        dispatch(boolean_action("blocks", story.user?.id || "")),
      title: `${is_blocked ? "Unblock" : "Block"} @${
        story.user?.username || ""
      }?`,
      description: is_blocked
        ? `The public content you publish will be available to them as well as the ability to follow you.`
        : `Your feed will not include their content, and they will not be able to follow you or interact with your profile.`
    }
  );

  /**
   * Deletes a draft
   */
  const handle_draft_delete = (): void => {
    delete_draft({ id: story.id })
      .unwrap()
      .then(() => {
        toast("Draft deleted", "success");
        dispatch(get_drafts_api.util.resetApiState());
      })
      .catch((error) =>
        handle_api_error(error, toast, null, "Could not delete your draft")
      );
  };

  const [delete_draft_element] = use_confirmation(
    ({ open_confirmation }) => (
      <MenuItem
        check_auth
        decorator={<TrashIcon />}
        onSelect={(event): void => {
          event.preventDefault(); // Do not auto-close the menu
          event.stopPropagation();
          open_confirmation();
        }}
      >
        Delete this draft
      </MenuItem>
    ),
    {
      color: "ruby",
      on_confirm: handle_draft_delete,
      title: "Delete this draft?",
      decorator: <TrashIcon />,
      description:
        "This action will delete the draft and transfer it to the deleted section. It can be restored from there within the specified time before permanent deletion."
    }
  );

  /**
   * Deletes a draft
   */
  const handle_story_delete = (): void => {
    delete_story({ id: story.id })
      .unwrap()
      .then(() => {
        toast("Story deleted", "success");
        dispatch(get_stories_api.util.resetApiState());
      })
      .catch((error) =>
        handle_api_error(error, toast, null, "Could not delete your story")
      );
  };

  const [delete_story_element] = use_confirmation(
    ({ open_confirmation }) => (
      <MenuItem
        check_auth
        decorator={<TrashIcon />}
        onSelect={(event): void => {
          event.preventDefault(); // Do not auto-close the menu
          event.stopPropagation();
          open_confirmation();
        }}
      >
        Delete this story
      </MenuItem>
    ),
    {
      color: "ruby",
      on_confirm: handle_story_delete,
      title: "Delete this story?",
      decorator: <TrashIcon />,
      description:
        "This action will delete the story and transfer it to the deleted section. It can be restored from there within the specified time before permanent deletion."
    }
  );

  /**
   * Deletes a draft
   */
  const handle_story_unpublish = (): void => {
    unpublish_story({ id: story.id })
      .unwrap()
      .then(() => {
        toast("Story unpublished", "success");
        dispatch(get_stories_api.util.resetApiState());
        dispatch(get_drafts_api.util.resetApiState());
      })
      .catch((error) =>
        handle_api_error(error, toast, null, "Could not unpublish your story")
      );
  };

  const [unpublish_story_element] = use_confirmation(
    ({ open_confirmation }) => (
      <MenuItem
        check_auth
        decorator={<EyeOffIcon />}
        onSelect={(event): void => {
          event.preventDefault(); // Do not auto-close the menu
          event.stopPropagation();
          open_confirmation();
        }}
      >
        Unpublish this story
      </MenuItem>
    ),
    {
      color: "ruby",
      on_confirm: handle_story_unpublish,
      title: "Unpublish this story?",
      decorator: <EyeOffIcon />,
      description: (
        <React.Fragment>
          This will move the story to your drafts, from where you can publish it
          again anytime with some limitations, such as your subscribers not
          being notified.{" "}
          <Link
            href={SUPPORT_ARTICLE_MAP.UNPUBLISHING_STORY}
            target={"_blank"}
            underline={"always"}
          >
            Learn more
          </Link>
        </React.Fragment>
      )
    }
  );

  return (
    <Menu
      trigger={
        <IconButton
          aria-label={"More options"}
          auto_size
          className={clsx(is_mobile && "force-light-mode")}
          onClick={(event): void => event.stopPropagation()}
          title={"More options"}
          variant={is_mobile ? "rigid" : "ghost"}
        >
          <DotsIcon />
        </IconButton>
      }
    >
      {is_draft ? (
        delete_draft_element
      ) : (
        <React.Fragment>
          <MenuItem
            decorator={<ShareIcon />}
            onClick={(event): void => {
              event.stopPropagation();
              share(
                story.title,
                `${process.env.NEXT_PUBLIC_WEB_URL}/${
                  is_self && current_user
                    ? current_user.username
                    : story.user?.username || "view"
                }/${story.slug || story.id}`
              );
            }}
          >
            Share this story
          </MenuItem>
          <MenuItem
            decorator={<CopyIcon />}
            onClick={(event): void => {
              event.stopPropagation();
              copy(
                `${process.env.NEXT_PUBLIC_WEB_URL}/${
                  is_self && current_user
                    ? current_user.username
                    : story.user?.username || "view"
                }/${story.slug || story.id}`
              );
            }}
          >
            Copy link to story
          </MenuItem>
          {!is_self && <Separator />}
          {is_extended ? (
            <React.Fragment>
              <MenuItem
                as={NextLink}
                check_auth
                decorator={<EditIcon />}
                href={`/doc/${story.id}`}
                onClick={(event): void => event.stopPropagation()}
              >
                Edit this story
              </MenuItem>
              <MenuItem
                as={NextLink}
                check_auth
                decorator={<CommentIcon />}
                href={`/me/content/stories/${story.id}/responses`}
                onClick={(event): void => event.stopPropagation()}
              >
                View responses
              </MenuItem>
              <MenuItem
                as={NextLink}
                check_auth
                decorator={<StoriesMetricsIcon />}
                href={`/me/content/stories/${story.id}/stats`}
                onClick={(event): void => event.stopPropagation()}
              >
                View stats
              </MenuItem>
              <Separator />
              {unpublish_story_element}
              {delete_story_element}
            </React.Fragment>
          ) : is_self ? null : (
            <React.Fragment>
              <ReportModal
                entity_id={story.id}
                entity_type={"story"}
                trigger={({ open_modal }): React.ReactElement => (
                  <MenuItem
                    decorator={<ReportIcon />}
                    onClick={open_modal}
                    onSelect={(event): void => {
                      event.preventDefault();
                      event.stopPropagation();
                    }}
                  >
                    Report this story
                  </MenuItem>
                )}
              />
              {logged_in && (
                <>
                  <Separator />
                  <MenuItem
                    check_auth
                    decorator={<MuteIcon />}
                    onClick={(event): void => {
                      event.stopPropagation();
                      dispatch(boolean_action("mutes", story.user?.id || ""));
                    }}
                  >
                    {is_muted ? "Unmute" : "Mute"} this writer
                  </MenuItem>
                  {block_element}
                </>
              )}
            </React.Fragment>
          )}
        </React.Fragment>
      )}
    </Menu>
  );
};

export default StoryActions;
