import { COMMENT_PROPS, REPLY_PROPS } from "@storiny/shared";
import React from "react";

import MenuItem from "~/components/MenuItem";
import { ModalFooterButton, useModal } from "~/components/Modal";
import { useToast } from "~/components/Toast";
import ResponseTextarea from "~/entities/ResponseTextarea";
import { useMediaQuery } from "~/hooks/useMediaQuery";
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
import { breakpoints } from "~/theme/breakpoints";
import { capitalize } from "~/utils/capitalize";

import { ResponseEditorProps } from "./response-editor.props";

const ResponseEditor = (props: ResponseEditorProps): React.ReactElement => {
  const { responseType, responseTextareaProps, responseId } = props;
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const toast = useToast();
  const dispatch = use_app_dispatch();
  const isSmallerThanMobile = useMediaQuery(breakpoints.down("mobile"));
  const [editComment, { isLoading: isCommentLoading }] =
    use_edit_comment_mutation();
  const [editReply, { isLoading: isReplyLoading }] = use_edit_reply_mutation();
  const isLoading = isCommentLoading || isReplyLoading;

  /**
   * Handles response editing
   */
  const handleEdit = (): void => {
    if (textareaRef.current?.value) {
      (responseType === "comment" ? editComment : editReply)({
        id: responseId,
        content: textareaRef.current.value
      })
        .unwrap()
        .then(() => {
          closeModal();
          toast(`${capitalize(responseType)} edited`);
          dispatch(
            (responseType === "comment"
              ? get_comments_api
              : get_replies_api
            ).util.resetApiState()
          );
        })
        .catch((e) =>
          toast(
            e?.data?.error || `Could not edit your ${responseType}`,
            "error"
          )
        );
    } else {
      toast("Response cannot be empty", "error");
    }
  };

  const [element, , closeModal] = useModal(
    ({ openModal }) => (
      <MenuItem
        checkAuth
        decorator={<EditIcon />}
        onSelect={(event): void => {
          event.preventDefault();
          openModal();
        }}
      >
        Edit {responseType}
      </MenuItem>
    ),
    <ResponseTextarea
      placeholder={"What do you think?"}
      {...responseTextareaProps}
      disabled={isLoading}
      hidePostButton
      maxLength={
        (responseType === "comment" ? COMMENT_PROPS : REPLY_PROPS).content
          .maxLength
      }
      minLength={
        (responseType === "comment" ? COMMENT_PROPS : REPLY_PROPS).content
          .minLength
      }
      ref={textareaRef}
    />,
    {
      fullscreen: isSmallerThanMobile,
      footer: (
        <>
          <ModalFooterButton
            compact={isSmallerThanMobile}
            disabled={isLoading}
            variant={"ghost"}
          >
            Cancel
          </ModalFooterButton>
          <ModalFooterButton
            compact={isSmallerThanMobile}
            loading={isLoading}
            onClick={(event): void => {
              event.preventDefault(); // Prevent closing of modal
              handleEdit();
            }}
          >
            Confirm
          </ModalFooterButton>
        </>
      ),
      slot_props: {
        footer: { compact: isSmallerThanMobile },
        content: {
          style: {
            width: isSmallerThanMobile ? "100%" : "422px"
          }
        },
        header: {
          decorator:
            responseType === "comment" ? <CommentIcon /> : <ReplyIcon />,
          children: `Editing ${responseType}`
        }
      }
    }
  );

  return element;
};

export default ResponseEditor;
