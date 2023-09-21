import { Comment } from "@storiny/types";
import NextLink from "next/link";
import React from "react";

import { useConfirmation } from "~/components/Confirmation";
import IconButton from "~/components/IconButton";
import Menu from "~/components/Menu";
import MenuItem from "~/components/MenuItem";
import Separator from "~/components/Separator";
import { useToast } from "~/components/Toast";
import ResponseEditor from "~/entities/common/ResponseEditor";
import { useClipboard } from "~/hooks/useClipboard";
import CopyIcon from "~/icons/Copy";
import DotsIcon from "~/icons/Dots";
import EyeIcon from "~/icons/Eye";
import EyeOffIcon from "~/icons/EyeOff";
import ReportIcon from "~/icons/Report";
import TrashIcon from "~/icons/Trash";
import {
  getCommentsApi,
  selectUser,
  useCommentDeleteMutation,
  useCommentVisibilityMutation
} from "~/redux/features";
import { useAppDispatch, useAppSelector } from "~/redux/hooks";

const CommentActions = ({
  comment,
  hidden: hiddenProp,
  setHidden: setHiddenProp
}: {
  comment: Comment;
  hidden: boolean;
  setHidden: React.Dispatch<React.SetStateAction<boolean>>;
}): React.ReactElement => {
  const copy = useClipboard();
  const toast = useToast();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const isSelf = user?.id === comment.user_id;
  const isStoryAuthor = user?.id === comment.story?.user_id;
  const [hidden, setHidden] = React.useState(hiddenProp);
  const [deleteComment, { isLoading: isDeleteLoading }] =
    useCommentDeleteMutation();
  const [commentVisibility, { isLoading: isVisibilityLoading }] =
    useCommentVisibilityMutation();

  /**
   * Deletes a comment
   */
  const handleCommentDelete = (): void => {
    deleteComment({ id: comment.id, storyId: comment.story_id })
      .unwrap()
      .then(() => {
        toast("Comment deleted", "success");
        dispatch(getCommentsApi.util.resetApiState());
      })
      .catch((e) =>
        toast(e?.data?.error || "Could not delete your comment", "error")
      );
  };

  const [deleteElement] = useConfirmation(
    ({ openConfirmation }) => (
      <MenuItem
        checkAuth
        decorator={<TrashIcon />}
        disabled={isDeleteLoading}
        onSelect={(event): void => {
          event.preventDefault(); // Do not auto-close the menu
          openConfirmation();
        }}
      >
        Delete comment
      </MenuItem>
    ),
    {
      color: "ruby",
      onConfirm: handleCommentDelete,
      title: "Delete this comment?",
      decorator: <TrashIcon />,
      description:
        "This comment will be permanently deleted, and it will not be possible to recover it later."
    }
  );

  /**
   * Mutates a comment's visibility
   */
  const handleCommentVisibility = (): void => {
    commentVisibility({
      id: comment.id,
      hidden: !hidden,
      storyId: comment.story_id
    })
      .unwrap()
      .then(() => {
        setHidden(!hidden);
        setHiddenProp(!hidden);
        toast(`Comment ${hidden ? "unhidden" : "hidden"}`, "success");
        dispatch(getCommentsApi.util.resetApiState());
      })
      .catch((e) =>
        toast(
          e?.data?.error || `Could not ${hidden ? "unhide" : "hide"} comment`,
          "error"
        )
      );
  };

  const [visibilityElement] = useConfirmation(
    ({ openConfirmation }) => (
      <MenuItem
        checkAuth
        decorator={hidden ? <EyeIcon /> : <EyeOffIcon />}
        disabled={isVisibilityLoading}
        onSelect={(event): void => {
          event.preventDefault(); // Do not auto-close the menu
          openConfirmation();
        }}
      >
        {hidden ? "Unhide" : "Hide"} comment
      </MenuItem>
    ),
    {
      onConfirm: handleCommentVisibility,
      title: `${hidden ? "Unhide" : "Hide"} this comment?`,
      decorator: <TrashIcon />,
      description: hidden
        ? "This comment will be unhidden and can be viewed by everyone."
        : "This comment will be partly hidden from everyone. However, others can still see this comment if they choose to."
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
              comment.story?.user?.username || "story"
            }/${comment.story?.slug || comment.story_id}/comments/${comment.id}`
          )
        }
      >
        Copy link to comment
      </MenuItem>
      <Separator />
      {isSelf ? (
        <React.Fragment>
          <ResponseEditor
            responseId={comment.id}
            responseTextareaProps={{
              defaultValue: comment.content
            }}
            responseType={"comment"}
          />
          {deleteElement}
        </React.Fragment>
      ) : (
        <React.Fragment>
          {isStoryAuthor && visibilityElement}
          <MenuItem
            as={NextLink}
            decorator={<ReportIcon />}
            href={`/report?id=${comment.id}&type=comment`}
            rel={"noreferrer"}
            target={"_blank"}
          >
            Report this comment
          </MenuItem>
        </React.Fragment>
      )}
    </Menu>
  );
};

export default CommentActions;
