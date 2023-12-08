import { Reply } from "@storiny/types";
import React from "react";

import { use_confirmation } from "~/components/confirmation";
import IconButton from "~/components/icon-button";
import Menu from "~/components/menu";
import MenuItem from "~/components/menu-item";
import Separator from "~/components/separator";
import { use_toast } from "~/components/toast";
import ReportModal from "~/entities/report-modal";
import { use_clipboard } from "~/hooks/use-clipboard";
import CopyIcon from "~/icons/copy";
import DotsIcon from "~/icons/dots";
import EyeIcon from "~/icons/eye";
import EyeOffIcon from "~/icons/eye-off";
import ReportIcon from "~/icons/report";
import TrashIcon from "~/icons/trash";
import {
  get_replies_api,
  select_user,
  use_delete_reply_mutation,
  use_reply_visibility_mutation
} from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import { handle_api_error } from "~/utils/handle-api-error";

import ResponseEditor from "../../common/response-editor";

const ReplyActions = ({
  reply,
  hidden: hidden_prop,
  set_hidden: set_hidden_prop
}: {
  hidden: boolean;
  reply: Reply;
  set_hidden: React.Dispatch<React.SetStateAction<boolean>>;
}): React.ReactElement => {
  const copy = use_clipboard();
  const toast = use_toast();
  const dispatch = use_app_dispatch();
  const user = use_app_selector(select_user);
  const is_self = user?.id === reply.user_id;
  const is_story_author = user?.id === reply.comment?.story?.user_id;
  const [hidden, set_hidden] = React.useState(hidden_prop);
  const [delete_reply, { isLoading: is_delete_loading }] =
    use_delete_reply_mutation();
  const [mutate_reply_visibility, { isLoading: is_visibility_loading }] =
    use_reply_visibility_mutation();

  /**
   * Deletes a reply
   */
  const handle_reply_delete = (): void => {
    delete_reply({ id: reply.id, comment_id: reply.comment_id })
      .unwrap()
      .then(() => {
        toast("Reply deleted", "success");
        dispatch(get_replies_api.util.resetApiState());
      })
      .catch((error) =>
        handle_api_error(error, toast, null, "Could not delete your reply")
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
        Delete reply
      </MenuItem>
    ),
    {
      color: "ruby",
      on_confirm: handle_reply_delete,
      title: "Delete this reply?",
      decorator: <TrashIcon />,
      description:
        "This reply will be permanently deleted, and it will not be possible to recover it later."
    }
  );

  /**
   * Mutates a reply's visibility
   */
  const handle_reply_visibility = (): void => {
    mutate_reply_visibility({ id: reply.id, hidden: !hidden })
      .unwrap()
      .then(() => {
        set_hidden(!hidden);
        set_hidden_prop(!hidden);
        toast(`Reply ${hidden ? "unhidden" : "hidden"}`, "success");
        dispatch(get_replies_api.util.resetApiState());
      })
      .catch((error) =>
        handle_api_error(
          error,
          toast,
          null,
          `Could not ${hidden ? "unhide" : "hide"} the reply`
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
        {hidden ? "Unhide" : "Hide"} reply
      </MenuItem>
    ),
    {
      on_confirm: handle_reply_visibility,
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
      {is_self ? (
        <React.Fragment>
          <ResponseEditor
            response_id={reply.id}
            response_textarea_props={{
              defaultValue: reply.content
            }}
            response_type={"reply"}
          />
          {delete_element}
        </React.Fragment>
      ) : (
        <React.Fragment>
          {is_story_author && visibility_element}
          <ReportModal
            entity_id={reply.id}
            entity_type={"reply"}
            trigger={({ open_modal }): React.ReactElement => (
              <MenuItem
                decorator={<ReportIcon />}
                onClick={open_modal}
                onSelect={(event): void => event.preventDefault()}
              >
                Report this reply
              </MenuItem>
            )}
          />
        </React.Fragment>
      )}
    </Menu>
  );
};

export default ReplyActions;
