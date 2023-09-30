import { Comment } from "@storiny/types";
import NextLink from "next/link";
import React from "react";

import { use_confirmation } from "~/components/confirmation";
import IconButton from "~/components/icon-button";
import Menu from "~/components/menu";
import MenuItem from "~/components/menu-item";
import Separator from "~/components/separator";
import { use_toast } from "~/components/toast";
import { use_clipboard } from "~/hooks/use-clipboard";
import CopyIcon from "~/icons/copy";
import DotsIcon from "~/icons/dots";
import EyeIcon from "~/icons/eye";
import EyeOffIcon from "~/icons/eye-off";
import ReportIcon from "~/icons/report";
import TrashIcon from "~/icons/trash";
import {
  get_comments_api,
  select_user,
  use_comment_visibility_mutation,
  use_delete_comment_mutation
} from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";

import ResponseEditor from "../../common/response-editor";

const CommentActions = ({
  comment,
  hidden: hidden_prop,
  set_hidden: set_hidden_prop
}: {
  comment: Comment;
  hidden: boolean;
  set_hidden: React.Dispatch<React.SetStateAction<boolean>>;
}): React.ReactElement => {
  const copy = use_clipboard();
  const toast = use_toast();
  const dispatch = use_app_dispatch();
  const user = use_app_selector(select_user);
  const is_self = user?.id === comment.user_id;
  const is_story_author = user?.id === comment.story?.user_id;
  const [hidden, set_hidden] = React.useState(hidden_prop);
  const [delete_comment, { isLoading: is_delete_loading }] =
    use_delete_comment_mutation();
  const [mutate_comment_visibility, { isLoading: is_visibility_loading }] =
    use_comment_visibility_mutation();

  /**
   * Deletes a comment
   */
  const handle_comment_delete = (): void => {
    delete_comment({ id: comment.id, story_id: comment.story_id })
      .unwrap()
      .then(() => {
        toast("Comment deleted", "success");
        dispatch(get_comments_api.util.resetApiState());
      })
      .catch((e) =>
        toast(e?.data?.error || "Could not delete your comment", "error")
      );
  };

  const [delete_element] = use_confirmation(
    ({ open_confirmation }) => (
      <MenuItem
        check_auth
        decorator={<TrashIcon />}
        disabled={is_delete_loading}
        onSelect={(event): void => {
          event.preventDefault(); // Do not auto-close the menu
          open_confirmation();
        }}
      >
        Delete comment
      </MenuItem>
    ),
    {
      color: "ruby",
      on_confirm: handle_comment_delete,
      title: "Delete this comment?",
      decorator: <TrashIcon />,
      description:
        "This comment will be permanently deleted, and it will not be possible to recover it later."
    }
  );

  /**
   * Mutates a comment's visibility
   */
  const handle_comment_visibility = (): void => {
    mutate_comment_visibility({
      id: comment.id,
      hidden: !hidden,
      story_id: comment.story_id
    })
      .unwrap()
      .then(() => {
        set_hidden(!hidden);
        set_hidden_prop(!hidden);
        toast(`Comment ${hidden ? "unhidden" : "hidden"}`, "success");
        dispatch(get_comments_api.util.resetApiState());
      })
      .catch((e) =>
        toast(
          e?.data?.error || `Could not ${hidden ? "unhide" : "hide"} comment`,
          "error"
        )
      );
  };

  const [visibility_element] = use_confirmation(
    ({ open_confirmation }) => (
      <MenuItem
        check_auth
        decorator={hidden ? <EyeIcon /> : <EyeOffIcon />}
        disabled={is_visibility_loading}
        onSelect={(event): void => {
          event.preventDefault(); // Do not auto-close the menu
          open_confirmation();
        }}
      >
        {hidden ? "Unhide" : "Hide"} comment
      </MenuItem>
    ),
    {
      on_confirm: handle_comment_visibility,
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
      {is_self ? (
        <React.Fragment>
          <ResponseEditor
            response_id={comment.id}
            response_textarea_props={{
              defaultValue: comment.content
            }}
            response_type={"comment"}
          />
          {delete_element}
        </React.Fragment>
      ) : (
        <React.Fragment>
          {is_story_author && visibility_element}
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
