import { commentProps, replyProps } from "@storiny/shared";
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
  getCommentsApi,
  getRepliesApi,
  useCommentEditMutation,
  useReplyEditMutation
} from "~/redux/features";
import { useAppDispatch } from "~/redux/hooks";
import { breakpoints } from "~/theme/breakpoints";
import { capitalize } from "~/utils/capitalize";

import { ResponseEditorProps } from "./ResponseEditor.props";

const ResponseEditor = (props: ResponseEditorProps): React.ReactElement => {
  const { responseType, responseTextareaProps, responseId } = props;
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const toast = useToast();
  const dispatch = useAppDispatch();
  const isSmallerThanMobile = useMediaQuery(breakpoints.down("mobile"));
  const [editComment, { isLoading: isCommentLoading }] =
    useCommentEditMutation();
  const [editReply, { isLoading: isReplyLoading }] = useReplyEditMutation();
  const isLoading = isCommentLoading || isReplyLoading;

  /**
   * Handles response editing
   */
  const handleEdit = (): void => {
    if (textareaRef.current) {
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
              ? getCommentsApi
              : getRepliesApi
            ).util.resetApiState()
          );
        })
        .catch((e) =>
          toast(
            e?.data?.error || `Could not edit your ${responseType}`,
            "error"
          )
        );
    }
  };

  const [element, , closeModal] = useModal(
    ({ openModal }) => (
      <MenuItem
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
        (responseType === "comment" ? commentProps : replyProps).content
          .maxLength
      }
      minLength={
        (responseType === "comment" ? commentProps : replyProps).content
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
      slotProps: {
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
