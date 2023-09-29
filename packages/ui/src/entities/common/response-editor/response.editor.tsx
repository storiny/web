import { COMMENT_PROPS, REPLY_PROPS } from "@storiny/shared";
import React from "react";
import MenuItem from "src/components/menu-item";
import { ModalFooterButton, use_modal } from "src/components/modal";
import { use_toast } from "src/components/toast";
import { use_media_query } from "src/hooks/use-media-query";

import ResponseTextarea from "src/entities/response-textarea";
import CommentIcon from "~/icons/Comment";
import EditIcon from "~/icons/Edit";
import ReplyIcon from "~/icons/Reply";
import {
  get_comments_api,
  get_replies_api,
  use_edit_comment_mutation,
  use_edit_reply_mutation
} from "~/redux/features";
import { use_app_dispatch } from "~/redux/hooks";
import { BREAKPOINTS } from "~/theme/breakpoints";
import { capitalize } from "~/utils/capitalize";

import { ResponseEditorProps } from "./response-editor.props";

const ResponseEditor = (props: ResponseEditorProps): React.ReactElement => {
  const { response_type, response_textarea_props, response_id } = props;
  const textarea_ref = React.useRef<HTMLTextAreaElement>(null);
  const toast = use_toast();
  const dispatch = use_app_dispatch();
  const is_smaller_than_mobile = use_media_query(BREAKPOINTS.down("mobile"));
  const [edit_comment, { isLoading: is_comment_loading }] =
    use_edit_comment_mutation();
  const [edit_reply, { isLoading: is_reply_loading }] =
    use_edit_reply_mutation();
  const is_loading = is_comment_loading || is_reply_loading;

  /**
   * Handles response editing
   */
  const handle_edit = (): void => {
    if (textarea_ref.current?.value) {
      (response_type === "comment" ? edit_comment : edit_reply)({
        id: response_id,
        content: textarea_ref.current.value
      })
        .unwrap()
        .then(() => {
          close_modal();
          toast(`${capitalize(response_type)} edited`);
          dispatch(
            (response_type === "comment"
              ? get_comments_api
              : get_replies_api
            ).util.resetApiState()
          );
        })
        .catch((e) =>
          toast(
            e?.data?.error || `Could not edit your ${response_type}`,
            "error"
          )
        );
    } else {
      toast("Response cannot be empty", "error");
    }
  };

  const [element, , close_modal] = use_modal(
    ({ open_modal }) => (
      <MenuItem
        check_auth
        decorator={<EditIcon />}
        onSelect={(event): void => {
          event.preventDefault();
          open_modal();
        }}
      >
        Edit {response_type}
      </MenuItem>
    ),
    <ResponseTextarea
      placeholder={"What do you think?"}
      {...response_textarea_props}
      disabled={is_loading}
      hide_post_button
      maxLength={
        (response_type === "comment" ? COMMENT_PROPS : REPLY_PROPS).content
          .maxLength
      }
      minLength={
        (response_type === "comment" ? COMMENT_PROPS : REPLY_PROPS).content
          .minLength
      }
      ref={textarea_ref}
    />,
    {
      fullscreen: is_smaller_than_mobile,
      footer: (
        <>
          <ModalFooterButton
            compact={is_smaller_than_mobile}
            disabled={is_loading}
            variant={"ghost"}
          >
            Cancel
          </ModalFooterButton>
          <ModalFooterButton
            compact={is_smaller_than_mobile}
            loading={is_loading}
            onClick={(event): void => {
              event.preventDefault(); // Prevent closing of modal
              handle_edit();
            }}
          >
            Confirm
          </ModalFooterButton>
        </>
      ),
      slot_props: {
        footer: { compact: is_smaller_than_mobile },
        content: {
          style: {
            width: is_smaller_than_mobile ? "100%" : "422px"
          }
        },
        header: {
          decorator:
            response_type === "comment" ? <CommentIcon /> : <ReplyIcon />,
          children: `Editing ${response_type}`
        }
      }
    }
  );

  return element;
};

export default ResponseEditor;
