import { REPLY_PROPS } from "@storiny/shared";
import { clsx } from "clsx";
import NextLink from "next/link";
import React from "react";

import Avatar from "~/components/Avatar";
import Button from "~/components/Button";
import { useToast } from "~/components/Toast";
import ResponseTextarea from "~/entities/ResponseTextarea";
import {
  getCommentRepliesApi,
  selectLoggedIn,
  selectUser,
  useAddReplyMutation
} from "~/redux/features";
import { useAppDispatch, useAppSelector } from "~/redux/hooks";

import styles from "./post-reply.module.scss";

const PostReply = ({
  commentId,
  placeholder
}: {
  commentId: string;
  placeholder: string;
}): React.ReactElement => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const loggedIn = useAppSelector(selectLoggedIn);
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const [addReply, { isLoading }] = useAddReplyMutation();

  const handlePost = (): void => {
    addReply({
      commentId,
      content: textareaRef.current?.value || ""
    })
      .unwrap()
      .then(() => {
        if (textareaRef.current) {
          textareaRef.current.value = "";
        }

        toast("Reply added", "success");
        dispatch(getCommentRepliesApi.util.resetApiState());
      })
      .catch((e) =>
        toast(e?.data?.error || "Could not add your reply", "error")
      );
  };

  return (
    <div
      className={clsx(
        "flex",
        styles["response-area"],
        !loggedIn && styles["logged-out"]
      )}
    >
      {!loggedIn ? (
        <Button as={NextLink} href={"/login"}>
          Log in to leave a reply
        </Button>
      ) : (
        <React.Fragment>
          <Avatar
            alt={""}
            avatarId={user?.avatar_id}
            hex={user?.avatar_hex}
            label={user?.name}
          />
          <ResponseTextarea
            maxLength={REPLY_PROPS.content.maxLength}
            minLength={REPLY_PROPS.content.minLength}
            placeholder={placeholder}
            postButtonProps={{
              loading: isLoading,
              onClick: handlePost
            }}
            ref={textareaRef}
            size={"sm"}
            slotProps={{
              container: {
                className: clsx("f-grow", styles.x, styles["response-textarea"])
              }
            }}
          />
        </React.Fragment>
      )}
    </div>
  );
};

export default PostReply;
