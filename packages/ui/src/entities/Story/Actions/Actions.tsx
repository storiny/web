import { Story } from "@storiny/types";
import { clsx } from "clsx";
import NextLink from "next/link";
import React from "react";

import { useConfirmation } from "~/components/Confirmation";
import IconButton from "~/components/IconButton";
import Link from "~/components/Link";
import Menu from "~/components/Menu";
import MenuItem from "~/components/MenuItem";
import Separator from "~/components/Separator";
import { useToast } from "~/components/Toast";
import { useClipboard } from "~/hooks/useClipboard";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import { useWebShare } from "~/hooks/useWebShare";
import CommentIcon from "~/icons/Comment";
import CopyIcon from "~/icons/Copy";
import DotsIcon from "~/icons/Dots";
import EditIcon from "~/icons/Edit";
import EyeOffIcon from "~/icons/EyeOff";
import MuteIcon from "~/icons/Mute";
import ReportIcon from "~/icons/Report";
import ShareIcon from "~/icons/Share";
import StoriesMetricsIcon from "~/icons/StoriesMetrics";
import TrashIcon from "~/icons/Trash";
import UserBlockIcon from "~/icons/UserBlock";
import {
  getDraftsApi,
  getStoriesApi,
  setBlock,
  setMute,
  useDraftDeleteMutation,
  useStoryDeleteMutation,
  useStoryUnpublishMutation
} from "~/redux/features";
import { selectLoggedIn } from "~/redux/features/auth/selectors";
import { useAppDispatch, useAppSelector } from "~/redux/hooks";
import { breakpoints } from "~/theme/breakpoints";

const StoryActions = ({
  story,
  isDraft,
  isExtended
}: {
  isDraft?: boolean;
  isExtended?: boolean;
  story: Story;
}): React.ReactElement => {
  const share = useWebShare();
  const copy = useClipboard();
  const toast = useToast();
  const dispatch = useAppDispatch();
  const isMobile = useMediaQuery(breakpoints.down("mobile"));
  const loggedIn = useAppSelector(selectLoggedIn);
  const isBlocking = useAppSelector(
    (state) => state.entities.blocks[story.user!.id]
  );
  const isMuted = useAppSelector(
    (state) => state.entities.mutes[story.user!.id]
  );
  const [deleteDraft] = useDraftDeleteMutation();
  const [deleteStory] = useStoryDeleteMutation();
  const [unpublishStory] = useStoryUnpublishMutation();
  const [blockElement] = useConfirmation(
    ({ openConfirmation }) => (
      <MenuItem
        checkAuth
        decorator={<UserBlockIcon />}
        onSelect={(event): void => {
          event.preventDefault(); // Do not auto-close the menu
          openConfirmation();
        }}
      >
        {isBlocking ? "Unblock" : "Block"} this writer
      </MenuItem>
    ),
    {
      color: isBlocking ? "inverted" : "ruby",
      onConfirm: () => dispatch(setBlock([story.user!.id])),
      title: `${isBlocking ? "Unblock" : "Block"} @${story.user!.username}?`,
      description: isBlocking
        ? `The public content you publish will be available to them as well as the ability to follow you.`
        : `Your feed will not include their content, and they will not be able to follow you or interact with your profile.`
    }
  );

  /**
   * Deletes a draft
   */
  const handleDraftDelete = (): void => {
    deleteDraft({ id: story.id })
      .unwrap()
      .then(() => {
        toast("Draft deleted", "success");
        dispatch(getDraftsApi.util.resetApiState());
      })
      .catch((e) =>
        toast(e?.data?.error || "Could not delete your draft", "error")
      );
  };

  const [deleteDraftElement] = useConfirmation(
    ({ openConfirmation }) => (
      <MenuItem
        checkAuth
        decorator={<TrashIcon />}
        onSelect={(event): void => {
          event.preventDefault(); // Do not auto-close the menu
          openConfirmation();
        }}
      >
        Delete this draft
      </MenuItem>
    ),
    {
      color: "ruby",
      onConfirm: handleDraftDelete,
      title: "Delete this draft?",
      decorator: <TrashIcon />,
      description:
        "This action will delete the draft and transfer it to the deleted section. It can be restored from there within the specified time before permanent deletion."
    }
  );

  /**
   * Deletes a draft
   */
  const handleStoryDelete = (): void => {
    deleteStory({ id: story.id })
      .unwrap()
      .then(() => {
        toast("Story deleted", "success");
        dispatch(getStoriesApi.util.resetApiState());
      })
      .catch((e) =>
        toast(e?.data?.error || "Could not delete your story", "error")
      );
  };

  const [deleteStoryElement] = useConfirmation(
    ({ openConfirmation }) => (
      <MenuItem
        checkAuth
        decorator={<TrashIcon />}
        onSelect={(event): void => {
          event.preventDefault(); // Do not auto-close the menu
          openConfirmation();
        }}
      >
        Delete this story
      </MenuItem>
    ),
    {
      color: "ruby",
      onConfirm: handleStoryDelete,
      title: "Delete this story?",
      decorator: <TrashIcon />,
      description:
        "This action will delete the story and transfer it to the deleted section. It can be restored from there within the specified time before permanent deletion."
    }
  );

  /**
   * Deletes a draft
   */
  const handleStoryUnpublish = (): void => {
    unpublishStory({ id: story.id })
      .unwrap()
      .then(() => {
        toast("Story unpublished", "success");
        dispatch(getStoriesApi.util.resetApiState());
        dispatch(getDraftsApi.util.resetApiState());
      })
      .catch((e) =>
        toast(e?.data?.error || "Could not unpublish your story", "error")
      );
  };

  const [unpublishStoryElement] = useConfirmation(
    ({ openConfirmation }) => (
      <MenuItem
        checkAuth
        decorator={<EyeOffIcon />}
        onSelect={(event): void => {
          event.preventDefault(); // Do not auto-close the menu
          openConfirmation();
        }}
      >
        Unpublish this story
      </MenuItem>
    ),
    {
      color: "ruby",
      onConfirm: handleStoryUnpublish,
      title: "Unpublish this story?",
      decorator: <EyeOffIcon />,
      description: (
        <React.Fragment>
          This will move the story to your drafts, from where you can publish it
          again anytime with some limitations, such as your subscribers not
          being notified.{" "}
          <Link href={"/guides/unpublishing"} underline={"always"}>
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
          autoSize
          className={clsx(isMobile && "force-light-mode")}
          title={"More options"}
          variant={isMobile ? "rigid" : "ghost"}
        >
          <DotsIcon />
        </IconButton>
      }
    >
      {isDraft ? (
        deleteDraftElement
      ) : (
        <React.Fragment>
          <MenuItem
            decorator={<ShareIcon />}
            onClick={(): void =>
              share(
                story.title,
                `${process.env.NEXT_PUBLIC_WEB_URL}/${story.user!.username}/${
                  story.slug
                }`
              )
            }
          >
            Share this story
          </MenuItem>
          <MenuItem
            decorator={<CopyIcon />}
            onClick={(): void =>
              copy(
                `${process.env.NEXT_PUBLIC_WEB_URL}/${story.user!.username}/${
                  story.slug
                }`
              )
            }
          >
            Copy link to story
          </MenuItem>
          <Separator />
          {isExtended ? (
            <React.Fragment>
              <MenuItem
                as={NextLink}
                checkAuth
                decorator={<EditIcon />}
                href={`/me/content/stories/${story.id}`}
              >
                Edit this story
              </MenuItem>
              <MenuItem
                as={NextLink}
                checkAuth
                decorator={<CommentIcon />}
                href={`/me/content/stories/${story.id}/responses`}
              >
                View responses
              </MenuItem>
              <MenuItem
                as={NextLink}
                checkAuth
                decorator={<StoriesMetricsIcon />}
                href={`/me/content/stories/${story.id}/metrics`}
              >
                View metrics
              </MenuItem>
              <Separator />
              {unpublishStoryElement}
              {deleteStoryElement}
            </React.Fragment>
          ) : (
            <React.Fragment>
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
                    checkAuth
                    decorator={<MuteIcon />}
                    onClick={(): void => {
                      dispatch(setMute([story.user!.id]));
                    }}
                  >
                    {isMuted ? "Unmute" : "Mute"} this writer
                  </MenuItem>
                  {blockElement}
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
