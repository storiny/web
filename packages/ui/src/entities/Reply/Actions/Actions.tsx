import { Reply } from "@storiny/types";
import NextLink from "next/link";
import React from "react";
import * as repl from "repl";

import { useConfirmation } from "~/components/Confirmation";
import IconButton from "~/components/IconButton";
import Menu from "~/components/Menu";
import MenuItem from "~/components/MenuItem";
import Separator from "~/components/Separator";
import { useToast } from "~/components/Toast";
import { useClipboard } from "~/hooks/useClipboard";
import CopyIcon from "~/icons/Copy";
import DotsIcon from "~/icons/Dots";
import EditIcon from "~/icons/Edit";
import EyeIcon from "~/icons/Eye";
import EyeOffIcon from "~/icons/EyeOff";
import ReportIcon from "~/icons/Report";
import TrashIcon from "~/icons/Trash";
import {
  getRepliesApi,
  selectUser,
  useReplyDeleteMutation,
  useReplyVisibilityMutation
} from "~/redux/features";
import { useAppDispatch, useAppSelector } from "~/redux/hooks";

const ReplyActions = ({
  reply,
  hidden: hiddenProp,
  setHidden: setHiddenProp
}: {
  hidden: boolean;
  reply: Reply;
  setHidden: React.Dispatch<React.SetStateAction<boolean>>;
}): React.ReactElement => {
  const copy = useClipboard();
  const toast = useToast();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const isSelf = user?.id === reply.user_id;
  const isStoryAuthor = user?.id === reply.comment?.story?.user_id;
  const [hidden, setHidden] = React.useState(hiddenProp);
  const [deleteReply, { isLoading: isDeleteLoading }] =
    useReplyDeleteMutation();
  const [replyVisibility, { isLoading: isVisibilityLoading }] =
    useReplyVisibilityMutation();

  /**
   * Deletes a reply
   */
  const handleReplyDelete = (): void => {
    deleteReply({ id: reply.id, commentId: reply.comment_id })
      .unwrap()
      .then(() => {
        toast("Reply deleted", "success");
        dispatch(getRepliesApi.util.resetApiState());
      })
      .catch((e) =>
        toast(e?.data?.error || "Could not delete your reply", "error")
      );
  };

  const [deleteElement] = useConfirmation(
    ({ openConfirmation }) => (
      <MenuItem
        decorator={<TrashIcon />}
        disabled={isDeleteLoading}
        onSelect={(event): void => {
          event.preventDefault(); // Do not auto-close the menu
          openConfirmation();
        }}
      >
        Delete reply
      </MenuItem>
    ),
    {
      color: "ruby",
      onConfirm: handleReplyDelete,
      title: "Delete this reply?",
      decorator: <TrashIcon />,
      description:
        "This reply will be permanently deleted, and it will not be possible to recover it later."
    }
  );

  /**
   * Mutates a reply's visibility
   */
  const handleReplyVisibility = (): void => {
    replyVisibility({ id: reply.id, hidden: !hidden })
      .unwrap()
      .then(() => {
        setHidden(!hidden);
        setHiddenProp(!hidden);
        toast(`Reply ${hidden ? "unhidden" : "hidden"}`, "success");
        dispatch(getRepliesApi.util.resetApiState());
      })
      .catch((e) =>
        toast(
          e?.data?.error || `Could not ${hidden ? "unhide" : "hide"} reply`,
          "error"
        )
      );
  };

  const [visibilityElement] = useConfirmation(
    ({ openConfirmation }) => (
      <MenuItem
        decorator={hidden ? <EyeIcon /> : <EyeOffIcon />}
        disabled={isVisibilityLoading}
        onSelect={(event): void => {
          event.preventDefault(); // Do not auto-close the menu
          openConfirmation();
        }}
      >
        {hidden ? "Unhide" : "Hide"} reply
      </MenuItem>
    ),
    {
      onConfirm: handleReplyVisibility,
      title: `${hidden ? "Unhide" : "Hide"} this reply?`,
      decorator: <TrashIcon />,
      description: hidden
        ? "This reply will be unhidden and can be viewed by everyone."
        : "This reply will be partly hidden from everyone. However, others can still see this reply if they choose to."
    }
  );

  return (
    <Menu
      trigger={
        <IconButton
          aria-label={"More options"}
          title={"More options"}
          variant={"ghost"}
        >
          <DotsIcon />
        </IconButton>
      }
    >
      <MenuItem
        decorator={<CopyIcon />}
        onClick={(): void =>
          copy(
            `${process.env.NEXT_PUBLIC_WEB_URL}/${
              reply.comment?.story?.user?.username || "story"
            }/${
              reply.comment?.story?.slug || reply.comment?.story_id
            }/comments/${reply.comment?.id}?reply=${reply.id}`
          )
        }
      >
        Copy link to reply
      </MenuItem>
      <Separator />
      {isSelf ? (
        <React.Fragment>
          <MenuItem
            as={NextLink}
            decorator={<EditIcon />}
            href={`/me/content/responses/${reply.id}/edit`}
          >
            Edit reply
          </MenuItem>
          {deleteElement}
        </React.Fragment>
      ) : (
        <React.Fragment>
          {isStoryAuthor && visibilityElement}
          <MenuItem
            as={NextLink}
            decorator={<ReportIcon />}
            href={`/report?id=${reply.id}&type=reply`}
            rel={"noreferrer"}
            target={"_blank"}
          >
            Report this reply
          </MenuItem>
        </React.Fragment>
      )}
    </Menu>
  );
};

export default ReplyActions;
